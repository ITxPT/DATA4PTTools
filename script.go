package greenlight

import (
	"fmt"
	"os"
	"path"

	"github.com/dop251/goja"
)

type Script struct {
	name     string
	source   []byte
	filePath string
	program  *goja.Program
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
	}

	program, err := goja.Compile(filePath, string(source), true)
	if err != nil {
		return nil, err
	}

	script.program = program

	vm := goja.New()
	vm.RunProgram(program)

	var name string
	if err := vm.ExportTo(vm.Get("name"), &name); err != nil {
		return nil, err
	}

	script.name = name

	// TODO get dependencies

	return script, nil
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
