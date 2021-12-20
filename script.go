package greenlight

import (
	"fmt"
	"os"
	"path"

	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/dop251/goja"
)

var (
	ErrVariableNotFound = fmt.Errorf("variable not found")
)

type Script struct {
	name        string
	description string
	source      []byte
	filePath    string
	program     *goja.Program
	logger      *Logger
}

func (s *Script) SetLogger(logger *Logger) {
	s.logger = logger
}

func (s *Script) Runtime() *goja.Runtime {
	vm := goja.New()
	vm.RunProgram(s.program)

	return vm
}

func NewScript(filePath string) (*Script, error) {
	source, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	script := &Script{
		source:   source,
		filePath: filePath,
		logger:   NewLogger(),
	}

	program, err := goja.Compile(filePath, string(source), true)
	if err != nil {
		return nil, err
	}

	script.program = program

	vm := goja.New()
	vm.RunProgram(program)

	if err := exportVariable("name", vm, &script.name); err != nil {
		return nil, err
	}

	exportVariable("description", vm, &script.description)

	// TODO get dependencies

	return script, nil
}

func exportVariable(field string, vm *goja.Runtime, target interface{}) error {
	v := vm.Get(field)
	if v == nil {
		return fmt.Errorf("variable '%s' not found", field)
	}

	return vm.ExportTo(v, target)
}

func executeScript(script *Script, doc types.Document) *ValidationResult {
	res := &ValidationResult{
		Measure:     &Measure{},
		Name:        script.name,
		Description: script.description,
		Valid:       true,
		Errors:      []string{},
	}
	defer func() {
		res.Stop()
	}()

	res.Start()

	ctx, err := netexContext(doc)
	if err != nil {
		res.AddError(err)
		return res
	}

	var validateHandler func(ctx jsObject, xpath jsObject) []string

	vm := script.Runtime()
	if err := vm.ExportTo(vm.Get("main"), &validateHandler); err != nil {
		res.AddError(err)
		return res
	}

	jsCtx := JSMainContext{
		script: script,
		tasks:  []jsTask{},

		Document:    doc,
		NodeContext: ctx,
	}

	if errors := validateHandler(jsCtx.JSObject(), jsStandardLib); errors != nil {
		for _, err := range errors {
			res.AddError(fmt.Errorf(err))
		}
	}

	return res
}

func CompileDir(dirPath string) ([]*Script, error) {
	scripts := []*Script{}
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		fullPath := fmt.Sprintf("%s/%s", dirPath, entry.Name())

		if entry.IsDir() {
			ss, err := CompileDir(fullPath)
			if err != nil {
				return nil, err
			}

			scripts = append(scripts, ss...)
		} else if path.Ext(entry.Name()) == ".js" {
			s, err := NewScript(fullPath)
			if err != nil {
				return nil, err
			}

			scripts = append(scripts, s)
		}
	}

	return scripts, nil
}

func CompileDirs(dirPaths []string) ([]*Script, error) {
	scripts := []*Script{}

	for _, dirPath := range dirPaths {
		ss, err := CompileDir(dirPath)
		if err != nil {
			return nil, err
		}

		scripts = append(scripts, ss...)
	}

	return scripts, nil
}
