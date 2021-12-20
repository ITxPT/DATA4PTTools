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

const (
	builtInPath = "./builtin"
)

type taskValidateFile struct {
	schema   *xsd.Schema
	filePath string
}

func (t taskValidateFile) Execute(id int) interface{} {
	return ValidateFile(t.schema, t.filePath)
}

type Measure struct {
	start time.Time
	stop  time.Time

	ExecutionTimeMS int64 `json:"execution_time_ms"`
}

func (m *Measure) Start() { m.start = time.Now() }
func (m *Measure) Stop() {
	m.stop = time.Now()
	m.ExecutionTimeMS = m.stop.Sub(m.start).Milliseconds()
}

type FileValidationResult struct {
	*Measure

	FileName        string              `json:"file_name"`
	FileSize        int64               `json:"file_size"`
	Valid           bool                `json:"valid"`
	GeneralError    string              `json:"general_error,omitempty"`
	ValidationRules []*ValidationResult `json:"validation_rules,omitempty"`
}

type ValidationResult struct {
	*Measure

	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	Valid       bool     `json:"valid"`
	ErrorCount  int      `json:"error_count,omitempty"`
	Errors      []string `json:"errors,omitempty"`
}

func (v *ValidationResult) AddError(err error) {
	v.Valid = false
	v.ErrorCount++

	if v.ErrorCount <= 32 {
		v.Errors = append(v.Errors, err.Error())
	}
}

func generalValidationError(name string, err error) *FileValidationResult {
	return &FileValidationResult{
		FileName:     name,
		Valid:        false,
		GeneralError: fmt.Sprintf("%s", err),
	}
}

func Validate(schema *xsd.Schema, doc types.Document, name string) *FileValidationResult {
	result := &FileValidationResult{
		Measure:         &Measure{},
		FileName:        name,
		Valid:           true,
		ValidationRules: []*ValidationResult{},
	}

	defer func() {
		result.Stop()
	}()

	result.Start()

	scriptDirs := []string{}
	if viper.GetBool("scripts.enableBuiltIn") {
		scriptDirs = append(scriptDirs, builtInPath)
	}

	// TODO scripts should be defined as a map in order to handle dependencies
	scripts, err := CompileDirs(scriptDirs)
	if err != nil {
		result.Valid = false
		result.GeneralError = err.Error()
		return result
	}

	for _, script := range scripts {
		script.SetLogger(
			NewLogger().
				AddTag("name", "main", 10).
				AddTag("script", script.name, 0).
				AddTag("document", name, 0),
		)

		result.ValidationRules = append(result.ValidationRules, executeScript(script, schema, doc))
	}

	return result
}

func ValidateReader(schema *xsd.Schema, reader io.Reader, name string) *FileValidationResult {
	doc, err := libxml2.ParseReader(reader)
	if err != nil {
		return generalValidationError(name, err)
	}

	return Validate(schema, doc, name)
}

func ValidateFile(schema *xsd.Schema, filePath string) *FileValidationResult {
	file, err := os.Open(filePath)
	if err != nil {
		return generalValidationError(filePath, err)
	}

	defer file.Close()

	doc, err := libxml2.ParseReader(file)
	if err != nil {
		return generalValidationError(filePath, err)
	}

	result := Validate(schema, doc, filePath)

	if fi, err := file.Stat(); err == nil {
		result.FileSize = fi.Size()
	}

	return result
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
