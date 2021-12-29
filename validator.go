package greenlight

import (
	"io"
	"os"

	"github.com/concreteit/greenlight/libxml2"
	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/concreteit/greenlight/libxml2/xsd"
)

const (
	builtInPath = "./builtin"
)

type ValidatorOption func(*Validator) error

type Validator struct {
	schema      *xsd.Schema
	useBuiltIn  bool
	scriptPaths []string
	scripts     ScriptMap
}

func NewValidator(options ...ValidatorOption) (*Validator, error) {
	var err error
	v := &Validator{
		useBuiltIn:  true,
		scriptPaths: []string{},
		scripts:     map[string]*Script{},
	}

	for _, option := range options {
		if err := option(v); err != nil {
			return nil, err
		}
	}

	scriptPaths := []string{}
	if v.useBuiltIn {
		scriptPaths = append(scriptPaths, builtInPath)
	}

	scriptPaths = append(scriptPaths, v.scriptPaths...)

	if v.scripts, err = CompilePath(scriptPaths...); err != nil {
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

	maxScriptWidth := stringMaxWidth(v.scripts.Keys())
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

func WithSchemaFile(filePath string) ValidatorOption {
	return func(v *Validator) error {
		if schema, err := xsd.ParseFromFile(filePath); err != nil {
			return err
		} else {
			v.schema = schema
		}

		return nil
	}
}

func WithDisabledBuiltInScripts() ValidatorOption {
	return func(v *Validator) error {
		v.useBuiltIn = false
		return nil
	}
}

func WithScriptPaths(paths []string) ValidatorOption {
	return func(v *Validator) error {
		v.scriptPaths = append(v.scriptPaths, paths...)
		return nil
	}
}
