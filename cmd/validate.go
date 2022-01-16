package main

import (
	"archive/zip"
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

	"github.com/MichaelMure/go-term-markdown"
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
	validateCmd.Flags().BoolP("fancy", "f", true, "Whether to show a fance progressbar instead of logs")
	validateCmd.Flags().StringSliceP("inputs", "i", []string{}, "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("log-level", "l", "", "Set logger level")
	validateCmd.Flags().StringP("output-format", "", "json", "Detailed validation report format")
	validateCmd.Flags().StringP("output-path", "", ".", "Detail validation report file location")
	validateCmd.Flags().StringP("report-format", "", "mdext", "Validation report format (mdext or mds")
	validateCmd.Flags().StringP("schema", "s", "xsd/NeTEx_publication.xsd", "Use XML Schema file for validation")
	validateCmd.Flags().StringP("scripts", "", "", "Directory or file path to look for scripts")
	validateCmd.Flags().BoolP("telemetry", "", true, "Whether to collect and send information about execution time")

	// default script paths
	viper.SetDefault("scripts", stringsJoin("scripts", configPaths, path.Join))

	// default `input` paths
	viper.SetDefault("inputs", stringsJoin("documents", configPaths, path.Join))

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
	viper.BindPFlag("inputs", validateCmd.Flags().Lookup("inputs"))
	viper.BindPFlag("fancy", validateCmd.Flags().Lookup("fancy"))
	viper.BindPFlag("logLevel", validateCmd.Flags().Lookup("log-level"))
	viper.BindPFlag("schema", validateCmd.Flags().Lookup("schema"))
	viper.BindPFlag("builtin", validateCmd.Flags().Lookup("builtin-scripts"))
	viper.BindPFlag("scripts", validateCmd.Flags().Lookup("scripts"))
	viper.BindPFlag("outputs.report.format", validateCmd.Flags().Lookup("report-format"))
	viper.BindPFlag("outputs.file.format", validateCmd.Flags().Lookup("output-format"))
	viper.BindPFlag("outputs.file.path", validateCmd.Flags().Lookup("output-path"))
	viper.BindPFlag("telemetry", validateCmd.Flags().Lookup("telemetry"))

	rootCmd.AddCommand(validateCmd)
}

func createValidationContext(input string) (*greenlight.ValidationContext, error) {
	ctx := greenlight.NewValidationContext(input)
	fi, err := os.Stat(input)
	if err != nil {
		return nil, err
	}

	if fi.IsDir() {
		fileEntries, err := os.ReadDir(input)
		if err != nil {
			return nil, err
		}

		for _, entry := range fileEntries {
			if path.Ext(entry.Name()) == ".xml" {
				file, err := os.Open(input + "/" + entry.Name())
				if err != nil {
					return nil, err
				}

				name := strings.TrimRight(entry.Name(), ".xml")
				if err := ctx.AddReader(name, file); err != nil {
					return nil, err
				}

				file.Close()
			}
		}
	} else {
		switch path.Ext(input) {
		case ".xml":
			file, err := os.Open(input)
			if err != nil {
				return nil, err
			}

			name := strings.TrimRight(path.Base(input), ".xml")
			if err := ctx.AddReader(name, file); err != nil {
				return nil, err
			}

			file.Close()
		case ".zip":
			r, err := zip.OpenReader(input)
			if err != nil {
				return nil, err
			}
			defer r.Close()

			for _, file := range r.File {
				if strings.Contains(file.Name, "__MACOSX") || path.Ext(file.Name) != ".xml" {
					continue
				}

				fr, err := file.Open()
				if err != nil {
					return nil, err
				}

				name := strings.TrimRight(file.Name, ".xml")
				if err := ctx.AddReader(name, fr); err != nil {
					return nil, err
				}

				fr.Close()
			}
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
	stdOut := logger.DefaultOutput()
	l := logger.New()
	if viper.GetString("logLevel") != "" {
		l.SetLogLevel(logger.LogLevel(viper.GetString("logLevel")))
		l.AddOutput(stdOut)
	}

	validator, err := greenlight.NewValidator(
		greenlight.WithSchemaFile(viper.GetString("schema")),
		greenlight.WithLogger(l),
		greenlight.WithBuiltinScripts(viper.GetBool("builtin")),
		greenlight.WithScriptingPaths(viper.GetStringSlice("scripts")),
	)
	if err != nil {
		fmt.Println(err)
		return
	}

	inputs := viper.GetStringSlice("inputs")
	if len(inputs) == 0 {
		fmt.Println("no input paths defined")
		return
	}

	contexts := []*greenlight.ValidationContext{}
	for _, path := range inputs {
		ctx, err := createValidationContext(greenlight.EnvPath(path))
		if err != nil {
			if _, ok := err.(*os.PathError); ok {
				continue
			}

			fmt.Println(err)
			continue
		}

		if viper.GetString("logLevel") == "" && viper.GetBool("fancy") {
			ctx.EnableProgressBar()
		}

		contexts = append(contexts, ctx)
	}

	details := []Details{}
	report := []string{}
	for _, ctx := range contexts {
		validator.Validate(ctx)
		mdext := true
		if viper.GetString("outpot.report.format") == "mds" {
			mdext = false
		}

		rstr := []string{}
		for _, r := range ctx.Results() {
			rstr = append(rstr, r.Markdown(mdext))

			if viper.GetBool("telemetry") {
				p := newPoint("document")
				p.AddField("schema_name", viper.GetString("schema"))
				p.AddField("schema_bytes", validator.SchemaSize())
				p.AddField("execution_time_ms", r.ExecutionTime().Milliseconds())
				p.AddField("name", r.Name)
				p.AddField("valid", r.Valid)
				writeAPI.WritePoint(p)

				for _, rule := range r.ValidationRules {
					p := newPoint("rule")
					p.AddField("schema_name", viper.GetString("schema"))
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

		rows := []string{
			fmt.Sprintf("- **path** %s", ctx.Name()),
			fmt.Sprintf("- **execution time** %fs", ctx.ExecutionTime().Seconds()),
		}
		hstr := string(markdown.Render(strings.Join(rows, "\n"), 80, 0))
		fstr := string(markdown.Render(strings.Join(rstr, "\n\n")+"\n\n---", 80, 4))
		report = append(report, hstr+fstr)
		details = append(details, Details{
			Path:    ctx.Name(),
			Results: ctx.Results(),
		})
	}

	writeAPI.Flush()

	fmt.Println("\n\n" + strings.Join(report, ""))

	if viper.GetString("outputs.file.format") != "" && viper.GetString("outputs.file.path") != "" {
		filePath := fmt.Sprintf("%s/report-%s.%s",
			viper.GetString("outputs.file.path"),
			time.Now().Format("20060102150405"),
			viper.GetString("outputs.file.format"),
		)
		f, err := os.Create(filePath)
		if err != nil {
			log.Fatal(err)
		}

		var enc encoder
		switch viper.GetString("outputs.file.format") {
		case "json":
			e := json.NewEncoder(f)
			e.SetIndent("", "  ")
			enc = e
		case "xml":
			e := xml.NewEncoder(f)
			e.Indent("  ", "    ")
			enc = e
		default:
			log.Fatalf("unsupport output file format '%s'\n", viper.GetString("outputs.file.format"))
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
		fmt.Println(name, err)
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
