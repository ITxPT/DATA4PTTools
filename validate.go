package greenlight

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/concreteit/greenlight/libxml2"
	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/concreteit/greenlight/libxml2/xsd"
	"github.com/spf13/viper"
)

// program start
// validate program input (cmd)
// read default or provided configuration (main.go)
// compile builtin scripts if enabled (true by default)
// compile scripts if provided
// determine script execution order (dependent on meta information provided in script)
// perform xsd validation
// execute script tasks

type FileValidationResult struct {
	FileName        string                  `json:"file_name"`
	ValidationTime  float64                 `json:"validation_time"`
	Valid           bool                    `json:"valid"`
	FileSize        int64                   `json:"file_size"`
	ErrorCount      int                     `json:"error_count,omitempty"`
	Errors          []string                `json:"errors,omitempty"`
	ValidationRules []*ValidationRuleResult `json:"validation_rules,omitempty"`
}

type ValidationRuleResult struct {
	Name           string   `json:"name"`
	Valid          bool     `json:"valid"`
	ValidationTime float64  `json:"validation_time"`
	ErrorCount     int      `json:"error_count,omitempty"`
	Errors         []string `json:"errors,omitempty"`
}

func (v *ValidationRuleResult) AddError(err error) {
	v.ErrorCount++

	if v.ErrorCount <= 32 {
		v.Errors = append(v.Errors, err.Error())
	}
}

func genericValidationError(name string, err error) *FileValidationResult {
	return &FileValidationResult{
		FileName:   name,
		Valid:      false,
		ErrorCount: 1,
		Errors:     []string{fmt.Sprintf("%s", err)},
	}
}

func Validate(schema *xsd.Schema, doc types.Document, name string) *FileValidationResult {
	result := &FileValidationResult{
		FileName:        name,
		Valid:           true,
		Errors:          []string{},
		ValidationRules: []*ValidationRuleResult{},
	}
	start := time.Now()

	defer func() {
		result.ValidationTime = time.Since(start).Seconds()
	}()

	if n, errors := schema.Validate(doc); n > 0 {
		result.Valid = false
		result.ErrorCount = n

		for _, err := range errors {
			result.Errors = append(result.Errors, err.Error())
		}
	}

	scriptDirs := []string{}
	if viper.GetBool("scripts.enableBuiltIn") {
		scriptDirs = append(scriptDirs, viper.GetString("scripts.builtInPath"))
	}

	// TODO scripts should be defined as a map in order to handle dependencies
	scripts, err := CompileDirs(scriptDirs)
	if err != nil {
		result.Errors = append(result.Errors, err.Error())
		return result
	}

	for _, script := range scripts {
		script.SetLogger(
			NewLogger().
				AddTag("name", "main", 10).
				AddTag("script", script.name, 0).
				AddTag("document", name, 0),
		)

		result.ValidationRules = append(result.ValidationRules, executeScript(script, doc))
	}

	return result
}

func ValidateReader(schema *xsd.Schema, reader io.Reader, name string) *FileValidationResult {
	doc, err := libxml2.ParseReader(reader)
	if err != nil {
		return genericValidationError(name, err)
	}

	return Validate(schema, doc, name)
}

func ValidateFile(schema *xsd.Schema, filePath string) *FileValidationResult {
	result := &FileValidationResult{
		FileName:        filePath,
		Valid:           true,
		Errors:          []string{},
		ValidationRules: []*ValidationRuleResult{},
	}
	file, err := os.Open(filePath)
	if err != nil {
		return genericValidationError(filePath, err)
	}

	if fi, err := file.Stat(); err == nil {
		result.FileSize = fi.Size()
	}

	defer file.Close()

	doc, err := libxml2.ParseReader(file)
	if err != nil {
		return genericValidationError(filePath, err)
	}

	return Validate(schema, doc, filePath)
}

type taskValidateFile struct {
	schema   *xsd.Schema
	filePath string
}

func (t taskValidateFile) Execute(id int) interface{} {
	return ValidateFile(t.schema, t.filePath)
}

func ValidateFiles(schema *xsd.Schema, filePaths []string) []*FileValidationResult {
	results := []*FileValidationResult{}
	numTasks := len(filePaths)
	tasks := make(chan task, numTasks)
	res := make(chan interface{}, numTasks)

	startWorkers(tasks, res)

	for _, filePath := range filePaths {
		tasks <- taskValidateFile{
			schema:   schema,
			filePath: filePath,
		}
	}
	close(tasks)

	for i := 0; i < numTasks; i++ {
		if vres, ok := (<-res).(*FileValidationResult); ok {
			results = append(results, vres)
		}
	}

	return results
}
