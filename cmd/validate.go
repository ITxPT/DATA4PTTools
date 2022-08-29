package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/concreteit/greenlight"
	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/js"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	validateCmd = &cobra.Command{
		Use:   "validate",
		Short: "Validate NeTEx files",
		Run:   validate,
	}
	scripts = map[string]*js.Script{}
)

type encoder interface {
	Encode(v interface{}) error
}

func stringsJoin(v string, o []string, joinHandler func(elem ...string) string) []string {
	res := []string{}

	for _, p := range o {
		res = append(res, joinHandler(p, v))
	}

	return res
}

func init() {
	if scriptMap, err := js.CompilePath("builtin"); err != nil {
		log.Fatal(err)
	} else {
		scripts = scriptMap
	}

	validateCmd.Flags().StringP("input", "i", "", "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("schema", "s", "netex@1.2", "Which xsd schema to use (supported \"netex@1.2\", \"netex@1.2-nc\", \"epip@1.1.1\", \"epip@1.1.1-nc\")")

	// read properties from environment
	viper.SetEnvPrefix("GREENLIGHT")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// bind from cli input
	viper.BindPFlag("input", validateCmd.Flags().Lookup("input"))
	viper.BindPFlag("output.log.level", validateCmd.Flags().Lookup("log-level"))
	viper.BindPFlag("output.log.disabled", validateCmd.Flags().Lookup("no-log"))
	viper.BindPFlag("output.result.format", validateCmd.Flags().Lookup("result-format"))
	viper.BindPFlag("output.result.disabled", validateCmd.Flags().Lookup("no-result"))
	viper.BindPFlag("schema", validateCmd.Flags().Lookup("schema"))
	viper.BindPFlag("builtin", validateCmd.Flags().Lookup("builtin-scripts"))
	viper.BindPFlag("scripts", validateCmd.Flags().Lookup("scripts"))
	viper.BindPFlag("telemetry", validateCmd.Flags().Lookup("telemetry"))

	rootCmd.AddCommand(validateCmd)
}

func openWithContext(ctx *FileContext, input string) error {
	fi, err := os.Stat(input)
	if err != nil {
		return err
	}

	if fi.IsDir() {
		entries, err := os.ReadDir(input)
		if err != nil {
			return err
		}

		for _, entry := range entries {
			if err := openWithContext(ctx, fmt.Sprintf("%s/%s", input, entry.Name())); err != nil {
				return err
			}
		}
	} else {
		file, err := os.Open(input)
		if err != nil {
			return err
		}
		if err := ctx.Open(input, file); err != nil {
			return err
		}
		defer file.Close()
	}

	return nil
}

func createValidation(input string) (*greenlight.Validation, error) {
	validation, err := greenlight.NewValidation()
	if err != nil {
		return nil, err
	}

	schema := viper.GetString("schema")
	if schema == "" {
		return nil, fmt.Errorf("no schema version defined")
	}

	/* validation.AddScript(scripts["stopPlaceQuayDistanceIsReasonable"], nil) */
	/* validation.AddScript(scripts["xsd"], map[string]interface{}{
	 *   "schema": schema,
	 * }) */
	for name, script := range scripts {
		if name == "xsd" {
			continue
		}
		validation.AddScript(script, nil)
	}

	fileContext := NewFileContext(context.Background())
	defer fileContext.Close()
	if err := openWithContext(fileContext, input); err != nil {
		return nil, err
	}

	for _, file := range fileContext.Find("xml") {
		f, err := file.Open()
		if err != nil {
			return nil, err
		}

		if err := validation.AddReader(file.Name, f); err != nil {
			return nil, err
		}
	}

	// subscribe to validation updates
	validation.Subscribe(func(event internal.Event) {
		fields := log.Fields{
			"id":    event.ContextID,
			"type":  event.Type,
			"scope": "main",
		}

		if event.Type == internal.EventTypeLog && event.Data != nil {
			level := log.DebugLevel
			message := ""
			for k, v := range event.Data {
				if k == "message" {
					message = v.(string)
				} else if k == "level" {
					l, ok := v.(string)
					if ok {
						switch l {
						case "debug":
							level = log.DebugLevel
							break
						case "info":
							level = log.InfoLevel
							break
						case "warn":
							level = log.WarnLevel
							break
						case "error":
							level = log.ErrorLevel
							break
						}
					}
				} else {
					fields[k] = v
				}
			}

			log.WithTime(event.Timestamp).WithFields(fields).Log(level, message)
		} else {
			log.WithTime(event.Timestamp).WithFields(fields).Trace(event.Type)
		}
	})

	return validation, nil
}

func validate(cmd *cobra.Command, args []string) {
	log.SetLevel(log.DebugLevel)
	log.SetFormatter(&log.TextFormatter{
		FullTimestamp: true,
	})

	input := viper.GetString("input")
	if input == "" {
		log.Fatal("no input provided")
	}

	validation, err := createValidation(internal.DirExpand(input))
	if err != nil {
		log.Fatal(err)
	}

	res := validation.Validate(context.Background())
	log.Println(res)

	/* for _, r := range res {
	 *   rows := r.CsvRecords(false)
	 *   log.Println(len(rows))
	 *   if len(rows) > 5 {
	 *     log.Println(rows[:5])
	 *   } else {
	 *     log.Println(rows)
	 *   }
	 * } */
}
