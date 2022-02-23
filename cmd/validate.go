package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log"
	"os"
	"path"
	"runtime"
	"strings"
	"time"

	"github.com/concreteit/greenlight"
	"github.com/concreteit/greenlight/logger"
	"github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api/write"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const (
	influxURL    = "https://europe-west1-1.gcp.cloud2.influxdata.com"
	influxToken  = "ZgkcIAuMuoSM0KcG38iui5nLQrYv9oLiSCfJ2sin2exvxJnbMQjUea1kGQrsGteKCazgo_83thED1lS1O1XYEw=="
	influxOrg    = "4b2adfedb7f7619e"
	influxBucket = "greenlight"
)

var (
	validateCmd = &cobra.Command{
		Use:   "validate",
		Short: "Validate NeTEx files",
		Run:   validate,
	}
	configPaths = []string{
		"$HOME/.greenlight",
		"/etc/greenlight",
		"/",
		"/greenlight",
		".",
	}
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
	validateCmd.Flags().StringP("builtin-scripts", "", "true", "Whether to use built in validation rules")
	validateCmd.Flags().StringSliceP("input", "i", []string{}, "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("log-level", "l", "debug", "Set logger level")
	validateCmd.Flags().StringP("log-path", "", ".", "Log file location")
	validateCmd.Flags().BoolP("no-constraint", "", false, "Use lite schema validation (w/o constraint)")
	validateCmd.Flags().StringP("report-format", "", "json", "Detailed validation report format")
	validateCmd.Flags().StringP("report-path", "", ".", "Detail validation report file location")
	validateCmd.Flags().StringP("schema", "s", "xsd/NeTEx_publication.xsd", "Use XML Schema file for validation")
	validateCmd.Flags().StringP("scripts", "", "", "Directory or file path to look for scripts")
	validateCmd.Flags().BoolP("telemetry", "", true, "Whether to collect and send information about execution time")

	// default script paths
	viper.SetDefault("scripts", stringsJoin("scripts", configPaths, path.Join))

	// default `input` paths
	viper.SetDefault("input", stringsJoin("documents", configPaths, path.Join))

	// set paths to look for configuration file (first come, first serve)
	for _, p := range configPaths {
		viper.AddConfigPath(p)
	}

	// name of configuration file, supported formats are JSON, TOML, YAML, HCL, INI, envfile or Java properties file
	viper.SetConfigName("config")

	// if no configuration is found defaults will be used
	viper.ReadInConfig()

	// read properties from environment
	viper.SetEnvPrefix("GREENLIGHT")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// bind from cli input
	viper.BindPFlag("input", validateCmd.Flags().Lookup("input"))
	viper.BindPFlag("logLevel", validateCmd.Flags().Lookup("log-level"))
	viper.BindPFlag("schema", validateCmd.Flags().Lookup("schema"))
	viper.BindPFlag("builtin", validateCmd.Flags().Lookup("builtin-scripts"))
	viper.BindPFlag("scripts", validateCmd.Flags().Lookup("scripts"))
	viper.BindPFlag("output.log.path", validateCmd.Flags().Lookup("log-path"))
	viper.BindPFlag("output.report.format", validateCmd.Flags().Lookup("report-format"))
	viper.BindPFlag("output.report.path", validateCmd.Flags().Lookup("report-path"))
	viper.BindPFlag("telemetry", validateCmd.Flags().Lookup("telemetry"))

	rootCmd.AddCommand(validateCmd)
}

func openWithContext(ctx *greenlight.FileContext, input string) error {
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

func createValidationContext(input string) (*greenlight.ValidationContext, error) {
	ctx := greenlight.NewValidationContext(input)
	fileContext := greenlight.NewFileContext(context.Background())
	defer fileContext.Close()
	if err := openWithContext(fileContext, input); err != nil {
		return nil, err
	}

	for _, file := range fileContext.Find("xml") {
		if err := ctx.AddReader(file.Name, file.File); err != nil {
			return nil, err
		}
	}

	return ctx, nil
}

type Details struct {
	Path    string                         `json:"path" xml:"path,attr"`
	Results []*greenlight.ValidationResult `json:"results" xml:"Result"`
}

func validate(cmd *cobra.Command, args []string) {
	client := influxdb2.NewClient(influxURL, influxToken)
	defer client.Close()

	writeAPI := client.WriteAPI(influxOrg, influxBucket)
	logFilePath := fmt.Sprintf("%s/log-%s",
		viper.GetString("output.log.path"),
		time.Now().Format("20060102150405"),
	)
	fileOutput, err := logger.NewFileOutput(greenlight.EnvPath(logFilePath))
	if err != nil {
		log.Fatal(err)
	}

	l := logger.New()
	l.AddOutput(fileOutput)
	if viper.GetString("logLevel") != "" {
		l.SetLogLevel(logger.LogLevel(viper.GetString("logLevel")))
	}

	schema := viper.GetString("schema")
	if nc, err := cmd.Flags().GetBool("no-constraint"); nc && err == nil {
		schema = "xsd/NeTEx_publication-NoConstraint.xsd"
	}
	validator, err := greenlight.NewValidator(
		greenlight.WithSchemaFile(schema),
		greenlight.WithLogger(l),
		greenlight.WithBuiltinScripts(viper.GetBool("builtin")),
		greenlight.WithScriptingPaths(viper.GetStringSlice("scripts")),
	)
	if err != nil {
		log.Fatal(err)
	}

	input := viper.GetStringSlice("input")
	if len(input) == 0 {
		log.Fatal("no input paths defined")
	}

	var ctx *greenlight.ValidationContext
	for _, path := range input {
		c, err := createValidationContext(greenlight.EnvPath(path))
		if err != nil {
			fmt.Println(err)
			return
		}

		ctx = c
		break
	}

	details := []Details{}
	validator.Validate(ctx)

	for _, r := range ctx.Results() {
		if viper.GetBool("telemetry") {
			p := newPoint("document")
			p.AddField("schema_name", schema)
			p.AddField("schema_bytes", validator.SchemaSize())
			p.AddField("execution_time_ms", r.ExecutionTime().Milliseconds())
			p.AddField("name", r.Name)
			p.AddField("valid", r.Valid)
			writeAPI.WritePoint(p)

			for _, rule := range r.ValidationRules {
				p := newPoint("rule")
				p.AddField("schema_name", schema)
				p.AddField("schema_bytes", validator.SchemaSize())
				p.AddField("execution_time_ms", rule.ExecutionTime().Milliseconds())
				p.AddField("document_name", r.Name)
				p.AddTag("name", rule.Name)
				p.AddField("valid", rule.Valid)
				p.AddField("error_count", rule.ErrorCount)
				writeAPI.WritePoint(p)
			}
		}
	}

	details = append(details, Details{
		Path:    ctx.Name(),
		Results: ctx.Results(),
	})

	writeAPI.Flush()

	if viper.GetString("output.report.format") != "" && viper.GetString("output.report.path") != "" {
		filePath := fmt.Sprintf("%s/report-%s.%s",
			viper.GetString("output.report.path"),
			time.Now().Format("20060102150405"),
			viper.GetString("output.report.format"),
		)
		f, err := os.Create(greenlight.EnvPath(filePath))
		if err != nil {
			log.Fatal(err)
		}

		var enc encoder
		switch viper.GetString("output.report.format") {
		case "json":
			e := json.NewEncoder(f)
			e.SetIndent("", "  ")
			enc = e
		case "xml":
			e := xml.NewEncoder(f)
			e.Indent("  ", "    ")
			enc = e
		default:
			log.Fatalf("unsupport output file format '%s'\n", viper.GetString("output.report.format"))
		}

		if err := enc.Encode(details); err != nil {
			log.Fatal(err)
		}
	}
}

func newPoint(measurement string) *write.Point {
	p := influxdb2.NewPointWithMeasurement(measurement).
		SetTime(time.Now()).
		AddTag("os", runtime.GOOS).
		AddTag("arch", runtime.GOARCH)

	if name, err := os.Hostname(); err == nil {
		p.AddTag("host", fmt.Sprintf("%x", sha256.Sum256([]byte(name))))
	}
	if n, err := cpu.Counts(true); err == nil {
		p.AddField("cpu_count", n)
	}
	if info, err := cpu.Info(); err == nil && len(info) > 0 {
		p.AddField("cpu_model", info[0].ModelName)
	}
	if info, err := mem.SwapMemory(); err == nil {
		p.AddField("swap_mem_total", info.Total).
			AddField("swap_mem_used", info.Used)
	}
	if info, err := mem.VirtualMemory(); err == nil {
		p.AddField("virtual_mem_total", info.Total).
			AddField("virtual_mem_used", info.Used)
	}

	return p
}
