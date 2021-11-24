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
)

var (
	validateCmd = &cobra.Command{
		Use:   "validate",
		Short: "Validate NeTEx files",
		Run: func(cmd *cobra.Command, args []string) {
			validate()
		},
	}
	input      string
	schemaPath string
)

type ValidationResult struct {
	TotalExecutionTime float64                            `json:"total_execution_time"`
	SchemaParseTime    float64                            `json:"schema_parse_time"`
	Validations        []*greenlight.FileValidationResult `json:"validations"`
}

func init() {
	validateCmd.Flags().StringVarP(&input, "input", "i", "", "XML file, dir or archive to validate")
	validateCmd.Flags().StringVarP(&schemaPath, "schema", "s", "./xsd/NeTEx_publication.xsd", "do validation against the schema")
	rootCmd.AddCommand(validateCmd)
}

func validate() {
	start := time.Now()
	result := ValidationResult{}
	schema, err := xsd.ParseFromFile(schemaPath)
	if err != nil {
		panic(err)
	}

	result.SchemaParseTime = time.Since(start).Seconds()
	fi, err := os.Stat(input)
	if err != nil {
		fmt.Print(err)
		return
	}

	if fi.IsDir() {
		fileEntries, err := os.ReadDir(input)
		if err != nil {
			fmt.Print(err)
			return
		}

		files := []string{}
		for _, entry := range fileEntries {
			if !entry.IsDir() {
				files = append(files, input+"/"+entry.Name())
			}
		}

		result.Validations = greenlight.ValidateFiles(schema, files)
	} else {
		switch path.Ext(input) {
		case ".xml":
			result.Validations = greenlight.ValidateFiles(schema, []string{input})
		case ".zip":
			r, err := zip.OpenReader(input)
			if err != nil {
				fmt.Print(err)
				return
			}
			defer r.Close()

			for _, f := range r.File {
				if strings.Contains(f.Name, "__MACOSX") {
					continue
				}

				fr, err := f.Open()
				if err != nil {
					fmt.Print(err)
					return
				}

				fileRes := greenlight.ValidateReader(schema, fr)
				fileRes.FileName = f.Name
				fileRes.FileSize = int64(f.UncompressedSize64)
				result.Validations = append(result.Validations, fileRes)
			}
		default:
			fmt.Print("invalid file format")
			return
		}

	}

	result.TotalExecutionTime = time.Since(start).Seconds()
	buf, _ := json.MarshalIndent(result, "", "  ")

	fmt.Println(string(buf))
}
