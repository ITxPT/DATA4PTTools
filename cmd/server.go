package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"runtime"
	"sort"
	"time"

	"github.com/concreteit/greenlight"
	"github.com/concreteit/greenlight/js"
	"github.com/eclipse/paho.mqtt.golang/packets"
	"github.com/fhmq/hmq/broker"
	"github.com/gorilla/websocket"
	"github.com/koding/websocketproxy"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	serverCmd = &cobra.Command{
		Use:   "server",
		Short: "Start NeTEx validation server",
		Run:   startServer,
	}
	defaultPort     = "8080"
	defaultMQTTPort = "1883"
	sessions        = SessionMap{
		sessions: map[string]*Session{},
	}
)

func init() {
	serverCmd.Flags().StringP("port", "p", "8080", "Which port to listen http server on")
	serverCmd.Flags().StringP("mqtt-port", "", "1883", "Which port to listen mqtt server on")

	viper.BindPFlag("port", serverCmd.Flags().Lookup("port"))
	viper.BindPFlag("mqtt-port", serverCmd.Flags().Lookup("mqtt-port"))

	rootCmd.AddCommand(serverCmd)
}

func brokerConfig() *broker.Config {
	runtime.GOMAXPROCS(runtime.NumCPU())

	cfg := broker.DefaultConfig
	cfg.WsPath = "/ws"
	cfg.WsPort = "1888"
	cfg.Debug = true

	return cfg
}

// TODO call this from server instance
func publishMessage(b *broker.Broker, topic string, message interface{}) error {
	if b == nil {
		return nil
	}

	buf, err := json.Marshal(message)
	if err != nil {
		return err
	}

	pub := packets.NewControlPacket(packets.Publish).(*packets.PublishPacket)
	pub.Qos = 0
	pub.TopicName = topic
	pub.Payload = buf

	b.PublishMessage(pub)

	return nil
}

type ValidationQuery struct {
	SessionID string   `param:"sid"`
	Schema    string   `query:"schema"`
	Rules     []string `query:"rules"`
}

func validateSession(ctx context.Context, rules []string, files []*FileInfo) (interface{}, error) {
	validation, err := greenlight.NewValidation()
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		f, err := file.Open()
		if err != nil {
			return nil, err
		}

		if err := validation.AddReader(file.Name, f); err != nil {
			return nil, err
		}

		file.File.Seek(0, 0)
	}

	scriptingPaths := []string{"builtin/xsd.js"}
	if rules != nil {
		for _, rule := range rules {
			scriptingPaths = append(scriptingPaths, "builtin/"+rule+".js")
		}
	}

	scriptMap, err := js.CompilePath(scriptingPaths...)
	if err != nil {
		return nil, err
	}

	for _, script := range scriptMap {
		validation.AddScript(script, nil)
	}

	return validation.Validate(ctx), nil
}

func startServer(cmd *cobra.Command, args []string) {
	port := viper.GetString("port")
	if port == "" {
		port = defaultPort
	}

	// viper.GetString("mqtt-port")

	fs := http.FileServer(StaticDir{http.Dir("app/out")})
	e := echo.New()
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		code := http.StatusInternalServerError
		if he, ok := err.(*echo.HTTPError); ok {
			code = he.Code
		}

		c.Logger().Error(err)
		c.JSON(code, map[string]string{"message": err.Error()})
	}

	e.Use(middleware.CORS())

	e.GET("/api/ping", func(c echo.Context) error {
		return c.String(http.StatusOK, "pong")
	})

	e.POST("/api/sessions", func(c echo.Context) error {
		s, err := sessions.New()
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, s)
	})

	e.GET("/api/sessions", func(c echo.Context) error {
		s := []*Session{}

		for _, v := range sessions.sessions {
			if v.Status != "created" {
				s = append(s, v)
			}
		}

		sort.Slice(s, func(i, j int) bool {
			return s[i].Created.Unix() > s[j].Created.Unix()
		})

		return c.JSON(http.StatusOK, s)
	})

	e.GET("/api/sessions/:sid", func(c echo.Context) error {
		session := sessions.Get(c.Param("sid"))
		if session == nil {
			return fmt.Errorf("session not found")
		}

		return c.JSON(http.StatusOK, session)
	})

	e.POST("/api/sessions/:sid/upload", func(c echo.Context) error {
		session := sessions.Get(c.Param("sid"))
		if session == nil {
			return fmt.Errorf("session not found")
		} else if session.Status != "created" {
			return fmt.Errorf("session already processed")
		}

		form, err := c.MultipartForm()
		if err != nil {
			return err
		}

		fileContext := NewFileContext(c.Request().Context())

		for _, files := range form.File {
			for _, file := range files {
				f, err := file.Open()
				if err != nil {
					return err
				}

				if err := fileContext.Open(file.Filename, f); err != nil {
					return err
				}

				f.Close()
			}
		}

		xmlFiles := fileContext.Find("xml")
		code := http.StatusOK
		if len(xmlFiles) == 0 {
			code = http.StatusBadRequest
		} else {
			session.fileContext.files = append(session.fileContext.files, fileContext.files...)
		}

		return c.JSON(code, session)
	})

	e.GET("/api/sessions/:sid/validate", func(c echo.Context) error {
		query := ValidationQuery{}
		if err := c.Bind(&query); err != nil {
			return err
		}

		session := sessions.Get(query.SessionID)
		if session == nil {
			return fmt.Errorf("session not found")
		} else if session.Status != "created" {
			return fmt.Errorf("session is already processed")
		}

		session.Status = "running"

		res, err := validateSession(c.Request().Context(), query.Rules, session.fileContext.Find("xml"))
		if err != nil {
			session.Stopped = time.Now()
			session.Status = "failure"
			return err
		}

		session.Stopped = time.Now()
		session.Status = "complete"
		session.Results = res

		return c.JSON(http.StatusOK, session)
	})

	e.GET("/report/:sid/:name", func(c echo.Context) error {
		session := sessions.Get(c.Param("sid"))
		if session == nil {
			return fmt.Errorf("session not found")
		}
		if session.Status != "complete" {
			if session.Status == "running" {
				return fmt.Errorf("validation is still running")
			} else {
				return fmt.Errorf("validation failed")
			}
		}

		/*     for _, v := range session.Results {
		 *       if v.Name != c.Param("name") {
		 *         continue
		 *       }
		 *
		 *       format := c.QueryParam("f")
		 *       switch format {
		 *       case "json":
		 *         return c.JSON(http.StatusOK, v)
		 *       case "csv":
		 *         var buf bytes.Buffer
		 *         bw := bufio.NewWriter(&buf)
		 *         w := csv.NewWriter(bw)
		 *         records := v.CsvRecords(true)
		 *
		 *         for _, record := range records {
		 *           if err := w.Write(record); err != nil {
		 *             return err
		 *           }
		 *         }
		 *
		 *         w.Flush()
		 *
		 *         if err := w.Error(); err != nil {
		 *           return err
		 *         }
		 *
		 *         return c.Blob(http.StatusOK, "text/csv", buf.Bytes())
		 *       default:
		 *         return c.String(http.StatusBadRequest, "unsupported file format")
		 *       }
		 *     } */

		return c.String(http.StatusNotFound, "validation report not found")
	})

	e.GET("/report/:sid", func(c echo.Context) error {
		session := sessions.Get(c.Param("sid"))
		if session == nil {
			return fmt.Errorf("session not found")
		}
		if session.Status != "complete" {
			if session.Status == "running" {
				return fmt.Errorf("validation is still running")
			} else {
				return fmt.Errorf("validation failed")
			}
		}

		format := c.QueryParam("f")
		switch format {
		case "json":
			return c.JSON(http.StatusOK, session.Results)
		case "csv":
			var buf bytes.Buffer
			bw := bufio.NewWriter(&buf)
			w := csv.NewWriter(bw)
			w.Write([]string{"file_name", "validation_name", "valid", "error_line_no", "error_message"})

			/*       for _, res := range session.Results {
			 *         records := res.CsvRecords(false)
			 *
			 *         for _, record := range records {
			 *           if err := w.Write(record); err != nil {
			 *             return err
			 *           }
			 *         }
			 *       } */

			w.Flush()

			if err := w.Error(); err != nil {
				return err
			}

			return c.Blob(http.StatusOK, "text/csv", buf.Bytes())
		}

		return c.String(http.StatusBadRequest, "unsupported file format")
	})

	u, err := url.Parse("ws://localhost:1888/ws")
	if err != nil {
		log.Fatalln(err)
	}

	wsProxy := websocketproxy.NewProxy(u)
	wsProxy.Upgrader = &websocket.Upgrader{}
	wsProxy.Upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	e.GET("/ws", func(c echo.Context) error {
		wsProxy.ServeHTTP(c.Response(), c.Request())
		return nil
	})

	e.Any("*", func(c echo.Context) error {
		fs.ServeHTTP(c.Response(), c.Request())
		return nil
	})

	e.Logger.Fatal(e.Start(":" + port))
}
