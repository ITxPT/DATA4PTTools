package main

import (
	"archive/zip"
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/MichaelMure/go-term-markdown"
	"github.com/concreteit/greenlight"
	"github.com/concreteit/greenlight/logger"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
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

func stringsJoin(v string, o []string, joinHandler func(elem ...string) string) []string {
	res := []string{}

	for _, p := range o {
		res = append(res, joinHandler(p, v))
	}

	return res
}

func init() {
	validateCmd.Flags().StringP("disable-builtin-scripts", "", "false", "Whether to disable built in validation rules")
	validateCmd.Flags().BoolP("fancy", "f", true, "Whether to show a fance progressbar instead of logs")
	validateCmd.Flags().StringSliceP("inputs", "i", []string{}, "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("log-level", "l", "", "Set logger level")
	validateCmd.Flags().StringP("schema", "s", "xsd/NeTEx_publication.xsd", "Use XML Schema file for validation")
	validateCmd.Flags().StringP("scripts", "", "", "Directory or file path to look for scripts")
	validateCmd.Flags().StringP("report-format", "", "mdext", "Validation report format (mdext or mds")

	// default script paths
	viper.SetDefault("scripts", stringsJoin("scripts", configPaths, path.Join))

	// default `input` paths
	viper.SetDefault("inputs", stringsJoin("documents", configPaths, path.Join))

	// default report format
	viper.SetDefault("outputs.report.format", "mdext")

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
	viper.BindPFlag("disableBuiltinScripts", validateCmd.Flags().Lookup("disable-builtin-scripts"))
	viper.BindPFlag("scripts", validateCmd.Flags().Lookup("scripts"))
	viper.BindPFlag("output.report.format", validateCmd.Flags().Lookup("report-format"))

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

func validate(cmd *cobra.Command, args []string) {
	stdOut := logger.DefaultOutput()
	l := logger.New()
	if viper.GetString("logLevel") != "" {
		l.SetLogLevel(logger.LogLevel(viper.GetString("logLevel")))
		l.AddOutput(stdOut)
	}

	validator, err := greenlight.NewValidator(
		greenlight.WithSchemaFile(viper.GetString("schema")),
		greenlight.WithLogger(l),
		greenlight.WithBuiltinScripts(!viper.GetBool("disableBuiltinScripts")),
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

	results := []string{}
	for _, ctx := range contexts {
		validator.Validate(ctx)
		mdext := true
		if viper.GetString("outpot.report.format") == "mds" {
			mdext = false
		}

		rstr := []string{}
		for _, r := range ctx.Results() {
			rstr = append(rstr, r.Markdown(mdext))
		}

		rows := []string{
			fmt.Sprintf("- **path** %s", ctx.Name()),
			fmt.Sprintf("- **execution time** %fs", ctx.ExecutionTime().Seconds()),
		}
		hstr := string(markdown.Render(strings.Join(rows, "\n"), 80, 0))
		fstr := string(markdown.Render(strings.Join(rstr, "\n\n")+"\n\n---", 80, 4))
		results = append(results, hstr+fstr)
	}

	fmt.Println("\n\n" + strings.Join(results, ""))
}
