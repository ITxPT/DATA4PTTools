package main

import (
	"os"
	"path"

	"github.com/concreteit/greenlight/js"
)

func compileBuiltin() (js.ScriptMap, error) {
	scriptMap := js.ScriptMap{}
	builtinPath := "builtin"
	scriptPaths, err := os.ReadDir(builtinPath)
	if err != nil {
		return nil, err
	}

	for _, entry := range scriptPaths {
		buf, err := os.ReadFile(path.Join(builtinPath, entry.Name()))
		if err != nil {
			return nil, err
		}

		if path.Ext(entry.Name()) != ".js" {
			continue
		}

		s, err := js.NewScript(entry.Name(), buf)
		if err != nil {
			return nil, err
		}

		scriptMap.Add(s)
	}

	return scriptMap, nil
}
