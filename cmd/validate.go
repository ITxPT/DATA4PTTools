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
	"github.com/concreteit/greenlight/libxml2/xsd"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	validateCmd = &cobra.Command{
		Use:   "validate",
		Short: "Validate NeTEx files",
		Run: func(cmd *cobra.Command, args []string) {
			validate()
		},
	}
)

type ValidationResult struct {
	*greenlight.Measure

	SchemaParseTime float64                            `json:"schema_parse_time"`
	Validations     []*greenlight.FileValidationResult `json:"validations"`
	GeneralError    string                             `json:"general_error,omitempty"`
}

func init() {
	validateCmd.Flags().StringP("input", "i", "", "XML file, dir or archive to validate")
	validateCmd.Flags().StringP("schema", "s", "", "do validation against the schema")
	viper.BindPFlag("input", validateCmd.Flags().Lookup("input"))
	viper.BindPFlag("schema", validateCmd.Flags().Lookup("schema"))
	rootCmd.AddCommand(validateCmd)
}

func validatePath(schema *xsd.Schema, input string) ([]*greenlight.FileValidationResult, error) {
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
		for _, entry := range fileEntries {
			vr, err := validatePath(schema, input+"/"+entry.Name())
			if err != nil {

			}

			res = append(res, vr...)
		}

		return res, nil
	} else {
		switch path.Ext(input) {
		case ".xml":
			return greenlight.ValidateFiles(schema, []string{input}), nil
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

				fileRes := greenlight.ValidateReader(schema, fr, input+"/"+f.Name)
				fileRes.FileSize = int64(f.UncompressedSize64)
				res = append(res, fileRes)
			}

			return res, nil
		default:
			return nil, fmt.Errorf("unsupported file format")
		}
	}
}

func validate() {
	start := time.Now()
	result := ValidationResult{
		Measure:     &greenlight.Measure{},
		Validations: []*greenlight.FileValidationResult{},
	}

	result.Start()

	schema, err := xsd.ParseFromFile(viper.GetString("schema"))
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
		res, _ := validatePath(schema, greenlight.EnvPath(path))
		result.Validations = append(result.Validations, res...)
	}

	result.Stop()
	logResult(result)
}

func logResult(result ValidationResult) {
	buf, _ := json.MarshalIndent(result, "", "  ")

	fmt.Println(string(buf))
}
