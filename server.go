package greenlight

import (
	"bufio"
	"bytes"
	"encoding/csv"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sort"
	"time"

	"github.com/gorilla/websocket"
	"github.com/koding/websocketproxy"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var (
	defaultPort     = "8080"
	defaultMQTTPort = "1883"
	sessions        = SessionMap{
		sessions: map[string]*Session{},
	}
)

type ServerConfig struct {
	Port     string
	MQTTPort string
}

func StartServer(cfg *ServerConfig) {
	port := defaultPort
	if cfg != nil && cfg.Port != "" {
		port = cfg.Port
	}

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
		session := sessions.Get(c.Param("sid"))
		if session == nil {
			return fmt.Errorf("session not found")
		} else if session.Status != "created" {
			return fmt.Errorf("session is already processed")
		}

		session.Status = "running"

		ctx := NewValidationContext(session.ID)
		for _, file := range session.fileContext.Find("xml") {
			f, err := file.Open()
			if err != nil {
				session.Stopped = time.Now()
				session.Status = "failure"
				return err
			}
			if err := ctx.AddReader(file.Name, f); err != nil {
				session.Stopped = time.Now()
				session.Status = "failure"
				return err
			}

			file.File.Seek(0, 0)
		}

		schema := c.QueryParam("schema")
		if schema == "" {
			schema = "netex"
		}

		switch schema {
		case "netex-light":
			schema = "xsd/NeTEx_publication-NoConstraint.xsd"
		case "netex":
			schema = "xsd/NeTEx_publication.xsd"
		case "epip":
			schema = "xsd/epip/NeTEx_publication_EPIP.xsd"
		}

		validator, err := NewValidator(
			WithSchemaFile(schema),
			WithBuiltinScripts(true),
		)
		if err != nil {
			session.Stopped = time.Now()
			session.Status = "failure"
			return err
		}

		validator.Validate(ctx)

		session.Stopped = time.Now()
		session.Status = "complete"
		session.Results = ctx.Results()

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

		for _, v := range session.Results {
			if v.Name != c.Param("name") {
				continue
			}

			format := c.QueryParam("f")
			switch format {
			case "json":
				return c.JSON(http.StatusOK, v)
			case "csv":
				var buf bytes.Buffer
				bw := bufio.NewWriter(&buf)
				w := csv.NewWriter(bw)
				records := v.CsvRecords(true)

				for _, record := range records {
					if err := w.Write(record); err != nil {
						return err
					}
				}

				w.Flush()

				if err := w.Error(); err != nil {
					return err
				}

				return c.Blob(http.StatusOK, "text/csv", buf.Bytes())
			default:
				return c.String(http.StatusBadRequest, "unsupported file format")
			}
		}

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

			for _, res := range session.Results {
				records := res.CsvRecords(false)

				for _, record := range records {
					if err := w.Write(record); err != nil {
						return err
					}
				}
			}

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
