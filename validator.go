package greenlight

import (
	"io"
	"os"
	"path"
	"strings"

	"github.com/concreteit/greenlight/logger"
	"github.com/lestrrat-go/libxml2"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xsd"
)

const (
	builtInPath = "./builtin"
)

type ValidatorOption func(*Validator) error

type Validator struct {
	schema      *xsd.Schema
	useBuiltIn  bool
	logger      *logger.Logger
	scriptPaths []string
	scripts     ScriptMap
}

func (v *Validator) Schema() *xsd.Schema {
	return v.schema
}

func NewValidator(options ...ValidatorOption) (*Validator, error) {
	var err error
	v := &Validator{
		useBuiltIn:  true,
		scriptPaths: []string{},
		scripts:     map[string]*Script{},
		logger:      logger.New(),
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

func (v *Validator) Validate(doc types.Document, name string, documents map[string]types.Document) *FileValidationResult {
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

	for _, script := range v.scripts {
		l := v.logger.Copy()
		l.AddTag(logger.NewTag("name", "main", logger.WithTagWidth(10)))
		l.AddTag(logger.NewTag("script", script.name, logger.WithTagMaxWidth(v.scripts.Keys())))
		l.AddTag(logger.NewTag("document", name))

		result.ValidationRules = append(result.ValidationRules, script.Execute(v.schema, l, doc, documents))
	}

	return result
}

func (v *Validator) ValidateReader(reader io.Reader, name string) *FileValidationResult {
	doc, err := libxml2.ParseReader(reader)
	if err != nil {
		return generalValidationError(name, err)
	}

	return v.Validate(doc, name, nil)
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

	result := v.Validate(doc, filePath, nil)

	if fi, err := file.Stat(); err == nil {
		result.FileSize = fi.Size()
	}

	return result
}

func (v *Validator) ValidateFiles(filePaths []string) []*FileValidationResult {
	results := []*FileValidationResult{}
	documents := map[string]types.Document{}

	for _, filePath := range filePaths {
		name := strings.Replace(path.Base(filePath), path.Ext(filePath), "", 1)
		file, err := os.Open(filePath)
		if err != nil {
			results = append(results, generalValidationError(filePath, err))
			continue
		}

		doc, err := libxml2.ParseReader(file)
		if err != nil {
			results = append(results, generalValidationError(filePath, err))
			continue
		}

		file.Close()

		documents[name] = doc
	}

	numTasks := len(documents)
	tasks := make(chan task, numTasks)
	res := make(chan interface{}, numTasks)

	startWorkers(tasks, res)

	for name, doc := range documents {
		tasks <- taskValidateDocument{
			validator: v,
			name:      name,
			document:  doc,
			documents: documents,
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

func WithBuiltinScripts(enabled bool) ValidatorOption {
	return func(v *Validator) error {
		v.useBuiltIn = enabled
		return nil
	}
}

func WithLogger(logger *logger.Logger) ValidatorOption {
	return func(v *Validator) error {
		v.logger = logger
		return nil
	}
}

func WithScriptingPaths(paths []string) ValidatorOption {
	return func(v *Validator) error {
		v.scriptPaths = append(v.scriptPaths, paths...)
		return nil
	}
}
