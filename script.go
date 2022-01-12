package greenlight

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path"

	"github.com/concreteit/greenlight/logger"
	"github.com/dop251/goja"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xsd"
)

var (
	ErrVariableNotFound = fmt.Errorf("variable not found")
)

type Script struct {
	name        string
	description string
	source      []byte
	checksum    string
	filePath    string
	program     *goja.Program
}

func (s *Script) Name() string {
	return s.name
}

func (s *Script) Description() string {
	return s.description
}

func (s *Script) Runtime() (*goja.Runtime, error) {
	vm := goja.New()

	for k, v := range jsStandardLib {
		if err := vm.GlobalObject().Set(k, v); err != nil {
			return nil, err
		}
	}

	vm.RunProgram(s.program)

	return vm, nil
}

func (s *Script) Execute(schema *xsd.Schema, l *logger.Logger, doc types.Document, docs map[string]types.Document) *RuleValidation {
	res := &RuleValidation{
		Measure:     &Measure{},
		Name:        s.name,
		Description: s.description,
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

	vm, err := s.Runtime()
	if err != nil {
		res.AddError(err)
		return res
	}

	if err := vm.ExportTo(vm.Get("main"), &validateHandler); err != nil {
		res.AddError(err)
		return res
	}

	jsCtx := jsContext{
		script:      s,
		logger:      l,
		tasks:       []jsTask{},
		schema:      schema,
		document:    doc,
		documents:   docs,
		nodeContext: ctx,
		node:        doc,
	}

	if errors := validateHandler(jsCtx.object(0), jsStandardLib); errors != nil {
		for _, err := range errors {
			res.AddError(fmt.Errorf(err))
		}
	}

	return res
}

func NewScript(filePath string) (*Script, error) {
	source, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	script := &Script{
		source:   source,
		checksum: fmt.Sprintf("%x", sha256.Sum256(source)),
		filePath: filePath,
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

	return script, nil
}

func exportVariable(field string, vm *goja.Runtime, target interface{}) error {
	v := vm.Get(field)
	if v == nil {
		return fmt.Errorf("variable '%s' not found", field)
	}

	return vm.ExportTo(v, target)
}

type ScriptMap map[string]*Script

func (m ScriptMap) Add(s *Script) error {
	if existing := m[s.name]; existing != nil {
		if existing.checksum != s.checksum {
			return fmt.Errorf("script with the name '%s' already exist with a different checksum", s.name)
		}

		return nil // identical script alridentical eady loaded
	}

	m[s.name] = s

	return nil
}

func (m ScriptMap) Keys() []string {
	i := 0
	keys := make([]string, len(m))
	for k := range m {
		keys[i] = k
		i++
	}

	return keys
}

func compilePath(scriptMap ScriptMap, filePath string) error {
	resolvedPath := EnvPath(filePath)
	fi, err := os.Stat(resolvedPath)
	if err != nil {
		if _, ok := err.(*os.PathError); ok {
			return nil
		}

		return err
	}

	if !fi.IsDir() && path.Ext(fi.Name()) == ".js" {
		s, err := NewScript(resolvedPath)
		if err != nil {
			return err
		}

		return scriptMap.Add(s)
	} else if fi.IsDir() {
		entries, err := os.ReadDir(resolvedPath)
		if err != nil {
			return err
		}

		for _, entry := range entries {
			err := compilePath(scriptMap, resolvedPath+"/"+entry.Name())
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func CompilePath(filePaths ...string) (ScriptMap, error) {
	scriptMap := ScriptMap{}
	for _, filePath := range filePaths {
		if err := compilePath(scriptMap, filePath); err != nil {
			return nil, err
		}
	}

	return scriptMap, nil
}
