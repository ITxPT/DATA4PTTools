package js

import (
	"crypto/sha256"
	"fmt"
	"reflect"
	"strings"

	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/xml"
	"github.com/dop251/goja"
)

type ScriptResult struct {
	Name        string
	Description string
	Errors      []ScriptError
}

type Script struct {
	name        string
	description string
	source      []byte
	checksum    string
	filePath    string
	program     *goja.Program
}

func (s *Script) Name() string { return s.name }

func (s *Script) Description() string { return s.description }

func (s *Script) Runtime() (*goja.Runtime, error) {
	vm := goja.New()

	if err := vm.GlobalObject().Set("require", Require); err != nil {
		return nil, err
	}

	vm.SetFieldNameMapper(fieldNameMapper{})
	vm.RunProgram(s.program)

	return vm, nil
}

func (s *Script) Run(
	name string,
	doc *xml.Document,
	emitter *internal.Emitter,
	coll *xml.Collection,
	config map[string]interface{},
) internal.Result {
	fields := map[string]interface{}{
		"scope":    "main",
		"script":   s.name,
		"document": name,
		"valid":    false,
	}
	emitter.Emit(internal.EventTypeScriptStart, fields)

	var handler ContextHandler

	vm, err := s.Runtime()
	if err != nil {
		return internal.NewResult(nil, err)
	}

	if err := vm.ExportTo(vm.Get("main"), &handler); err != nil {
		return internal.NewResult(nil, err)
	}

	ctx, err := NewContext(
		s,
		WithConfig(config),
		WithEmitter(emitter),
		WithMetaFields(fields),
		WithNode(doc),
		WithDocument(doc),
		WithCollection(coll),
	)
	if err != nil {
		return internal.NewResult(nil, err)
	}

	errors := []ScriptError{}
	for _, r := range handler(ctx) {
		if v, ok := r.(ScriptError); !ok {
			return internal.NewResult(nil, fmt.Errorf("expected '%v' is not of type ScriptError", r))
		} else {
			errors = append(errors, v)
		}
	}

	fields["valid"] = len(errors) == 0
	fields["errors"] = errors
	defer emitter.Emit(internal.EventTypeScriptStop, fields)

	return internal.NewResult(ScriptResult{
		Name:        s.name,
		Description: s.description,
		Errors:      errors,
	}, nil)
}

func NewScript(name string, source []byte) (*Script, error) {
	script := &Script{
		source:   source,
		checksum: fmt.Sprintf("%x", sha256.Sum256(source)),
		filePath: name,
	}

	program, err := goja.Compile(name, string(source), true)
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
			return fmt.Errorf("script with the name '%s' already exist with a different checksum '%s'", s.name, existing.name)
		}

		return nil // identical script already loaded
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

func uncapitalize(s string) string {
	if s == "Free" { // reserved names
		return ""
	}

	return strings.ToLower(s[0:1]) + s[1:]
}

type fieldNameMapper struct{}

func (fnp fieldNameMapper) FieldName(_ reflect.Type, f reflect.StructField) string {
	return uncapitalize(f.Name)
}

func (fnp fieldNameMapper) MethodName(_ reflect.Type, m reflect.Method) string {
	return uncapitalize(m.Name)
}
