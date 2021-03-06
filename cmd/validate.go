package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log"
	"os"
	"path"
	"strings"

	"github.com/concreteit/greenlight"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
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
	validateCmd.Flags().StringP("input", "i", "", "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("log-level", "l", "debug", "Set logger level")
	validateCmd.Flags().BoolP("no-log", "", false, "Whether log output should be disabled")
	validateCmd.Flags().BoolP("no-constraint", "", false, "Use lite schema validation (w/o constraint)")
	validateCmd.Flags().StringP("result-format", "", "json", "Detailed validation result format")
	validateCmd.Flags().BoolP("no-result", "", false, "Whether result output should be disabled")
	validateCmd.Flags().StringP("schema", "s", "xsd/NeTEx_publication.xsd", "Use XML Schema file for validation")
	validateCmd.Flags().StringP("scripts", "", "", "Directory or file path to look for scripts")

	// default script paths
	viper.SetDefault("scripts", stringsJoin("scripts", configPaths, path.Join))

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
		f, err := file.Open()
		if err != nil {
			return nil, err
		}

		if err := ctx.AddReader(file.Name, f); err != nil {
			return nil, err
		}
	}

	return ctx, nil
}

func validate(cmd *cobra.Command, args []string) {
	logger, err := newLogger()
	if err != nil {
		log.Fatal(err)
	}
	defer logger.Sync()

	schema := viper.GetString("schema")
	if nc, err := cmd.Flags().GetBool("no-constraint"); nc && err == nil {
		schema = "xsd/NeTEx_publication-NoConstraint.xsd"
	}
	validator, err := greenlight.NewValidator(
		greenlight.WithSchemaFile(schema),
		greenlight.WithLogger(logger),
		greenlight.WithBuiltinScripts(viper.GetBool("builtin")),
		greenlight.WithScriptingPaths(viper.GetStringSlice("scripts")),
	)
	if err != nil {
		log.Fatal(err)
	}

	input := viper.GetString("input")
	if input == "" {
		log.Fatal("no input provided")
	}

	ctx, err := createValidationContext(greenlight.EnvPath(input))
	if err != nil {
		log.Fatal(err)
	}

	validator.Validate(ctx)

	if !viper.GetBool("output.result.disabled") {
		switch viper.GetString("output.result.format") {
		case "json":
			buf, err := json.MarshalIndent(ctx.Results(), "", " ")
			if err != nil {
				fmt.Println(err)
			} else {
				fmt.Println(string(buf))
			}
		case "plain":
			results := ctx.Results()
			for _, result := range results {
				rows := result.CsvRecords(true)
				for _, row := range rows {
					fmt.Println(strings.Join(row, ","))
				}
			}
		case "xml":
			buf, err := xml.MarshalIndent(ctx.Results(), "", " ")
			if err != nil {
				fmt.Println(err)
			} else {
				fmt.Println(string(buf))
			}
		}
	}
}

func newLogger() (*zap.Logger, error) {
	loggerOptions := []zap.Option{}
	if viper.GetBool("output.log.disabled") {
		loggerOptions = append(loggerOptions, zap.IncreaseLevel(zapcore.FatalLevel))
	} else if viper.GetString("output.log.level") != "" {
		switch viper.GetString("output.log.level") {
		case "debug":
			loggerOptions = append(loggerOptions, zap.IncreaseLevel(zapcore.DebugLevel))
		case "info":
			loggerOptions = append(loggerOptions, zap.IncreaseLevel(zapcore.InfoLevel))
		case "warn":
			loggerOptions = append(loggerOptions, zap.IncreaseLevel(zapcore.WarnLevel))
		case "error":
			loggerOptions = append(loggerOptions, zap.IncreaseLevel(zapcore.ErrorLevel))
		}
	}

	return zap.NewDevelopment(loggerOptions...)
}
