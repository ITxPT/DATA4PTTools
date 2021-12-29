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
	validator *Validator
	filePath  string
}

func (t taskValidateFile) Execute(id int) interface{} {
	return t.validator.ValidateFile(t.filePath)
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

type Validator struct {
	schema  *xsd.Schema
	scripts map[string]*Script
}

func NewValidator(schemaPath string) (*Validator, error) {
	var err error
	v := &Validator{
		scripts: map[string]*Script{},
	}

	if v.schema, err = xsd.ParseFromFile(schemaPath); err != nil {
		return nil, err
	}

	scriptDirs := []string{}
	if viper.GetBool("scripts.enableBuiltIn") {
		scriptDirs = append(scriptDirs, builtInPath)
	}

	scriptDirs = append(scriptDirs, viper.GetStringSlice("scripts.paths")...)

	if v.scripts, err = CompileDirs(scriptDirs); err != nil {
		return nil, err
	}

	return v, nil
}

func (v *Validator) Validate(doc types.Document, name string) *FileValidationResult {
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

	maxScriptWidth := stringMaxWidth(scriptMapKeys(v.scripts))
	for _, script := range v.scripts {
		script.SetLogger(
			script.logger.Copy().
				AddTag("name", "main", 10).
				AddTag("script", script.name, maxScriptWidth).
				AddTag("document", name, 0),
		)

		result.ValidationRules = append(result.ValidationRules, executeScript(script, v.schema, doc))
	}

	return result
}

func (v *Validator) ValidateReader(reader io.Reader, name string) *FileValidationResult {
	doc, err := libxml2.ParseReader(reader)
	if err != nil {
		return generalValidationError(name, err)
	}

	return v.Validate(doc, name)
}

func (v *Validator) ValidateFile(filePath string) *FileValidationResult {
	file, err := os.Open(filePath)
	if err != nil {
		return generalValidationError(filePath, err)
	}

	defer file.Close()

	doc, err := libxml2.ParseReader(file)
	if err != nil {
		return generalValidationError(filePath, err)
	}

	result := v.Validate(doc, filePath)

	if fi, err := file.Stat(); err == nil {
		result.FileSize = fi.Size()
	}

	return result
}

func (v *Validator) ValidateFiles(filePaths []string) []*FileValidationResult {
	results := []*FileValidationResult{}
	numTasks := len(filePaths)
	tasks := make(chan task, numTasks)
	res := make(chan interface{}, numTasks)

	startWorkers(tasks, res)

	for _, filePath := range filePaths {
		tasks <- taskValidateFile{
			validator: v,
			filePath:  filePath,
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
