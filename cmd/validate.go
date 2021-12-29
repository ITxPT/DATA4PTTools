package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"strings"
	"time"

	"github.com/concreteit/greenlight"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	validateCmd = &cobra.Command{
		Use:   "validate",
		Short: "Validate NeTEx files",
		Run:   validate,
	}
)

func init() {
	validateCmd.Flags().StringP("input", "i", "", "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("schema", "s", "", "do validation against the schema")

	viper.BindPFlag("input", validateCmd.Flags().Lookup("input"))
	viper.BindPFlag("schema", validateCmd.Flags().Lookup("schema"))

	rootCmd.AddCommand(validateCmd)
}

type ValidationResult struct {
	*greenlight.Measure

	SchemaParseTime float64                            `json:"schema_parse_time"`
	Validations     []*greenlight.FileValidationResult `json:"validations"`
	GeneralError    string                             `json:"general_error,omitempty"`
}

func validatePath(v *greenlight.Validator, input string) ([]*greenlight.FileValidationResult, error) {
	fi, err := os.Stat(input)
	if err != nil {
		return nil, err
	}

	if fi.IsDir() {
		fileEntries, err := os.ReadDir(input)
		if err != nil {
			return nil, err
		}

		res := []*greenlight.FileValidationResult{}
		filePaths := []string{}
		for _, entry := range fileEntries {
			filePath := input + "/" + entry.Name()

			if path.Ext(entry.Name()) == ".xml" {
				filePaths = append(filePaths, filePath)
			} else {
				vr, _ := validatePath(v, input+"/"+entry.Name()) // TODO we currently dont care about errors on os level
				res = append(res, vr...)
			}
		}

		res = append(res, v.ValidateFiles(filePaths)...)

		return res, nil
	} else {
		switch path.Ext(input) {
		case ".xml":
			return v.ValidateFiles([]string{input}), nil
		case ".zip":
			r, err := zip.OpenReader(input)
			if err != nil {
				return nil, err
			}
			defer r.Close()

			res := []*greenlight.FileValidationResult{}

			for _, f := range r.File {
				if strings.Contains(f.Name, "__MACOSX") || path.Ext(f.Name) != ".xml" {
					continue
				}

				fr, err := f.Open()
				if err != nil {
					return nil, err
				}

				fileRes := v.ValidateReader(fr, input+"/"+f.Name)
				fileRes.FileSize = int64(f.UncompressedSize64)
				res = append(res, fileRes)
			}

			return res, nil
		default:
			return nil, fmt.Errorf("unsupported file format")
		}
	}
}

func validate(cmd *cobra.Command, args []string) {
	start := time.Now()
	result := ValidationResult{
		Measure:     &greenlight.Measure{},
		Validations: []*greenlight.FileValidationResult{},
	}

	result.Start()

	validator, err := greenlight.NewValidator(
		greenlight.WithSchemaFile(viper.GetString("schema")),
	)
	if err != nil {
		result.GeneralError = err.Error()
		logResult(result)
		return
	}

	result.SchemaParseTime = time.Since(start).Seconds()
	input := viper.GetStringSlice("input")
	if len(input) == 0 {
		result.GeneralError = "no input paths defined"
		logResult(result)
		return
	}

	for _, path := range input {
		res, _ := validatePath(validator, greenlight.EnvPath(path))
		result.Validations = append(result.Validations, res...)
	}

	result.Stop()
	logResult(result)
}

func logResult(result ValidationResult) {
	buf, _ := json.MarshalIndent(result, "", "  ")

	fmt.Println(string(buf))
}
