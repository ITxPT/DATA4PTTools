package greenlight

import (
	"context"
	"os"
	"path"
	"testing"

	"github.com/concreteit/greenlight/js"
)

var (
	filePath = "./testdata/line_38_9011005003800000.xml" // size: 130K
	dirPath  = "./testdata"
	scripts  = map[string]*js.Script{}
)

func TestMain(m *testing.M) {
	var err error
	scripts, err = compileBuiltin()
	if err != nil {
		panic(err)
	}

	// pre-load schemas
	if _, err := js.CompileSchemaVersion("netex@1.2"); err != nil {
		panic(err)
	}
	if _, err := js.CompileSchemaVersion("netex@1.2-nc"); err != nil {
		panic(err)
	}
	if _, err := js.CompileSchemaVersion("epip@1.1.1"); err != nil {
		panic(err)
	}
	if _, err := js.CompileSchemaVersion("epip@1.1.1-nc"); err != nil {
		panic(err)
	}

	os.Exit(m.Run())
}

func BenchmarkValidateOneNetex(b *testing.B)       { benchmarkValidate("netex@1.2", filePath, b) }
func BenchmarkValidateListNetex(b *testing.B)      { benchmarkValidate("netex@1.2", dirPath, b) }
func BenchmarkValidateOneNetexLight(b *testing.B)  { benchmarkValidate("netex@1.2-nc", filePath, b) }
func BenchmarkValidateListNetexLight(b *testing.B) { benchmarkValidate("netex@1.2-nc", dirPath, b) }
func BenchmarkValidateOneEPIP(b *testing.B)        { benchmarkValidate("epip@1.1.1", filePath, b) }
func BenchmarkValidateListEPIP(b *testing.B)       { benchmarkValidate("epip@1.1.1", dirPath, b) }
func BenchmarkValidateOneEPIPLight(b *testing.B)   { benchmarkValidate("epip@1.1.1-nc", filePath, b) }
func BenchmarkValidateListEPIPLight(b *testing.B)  { benchmarkValidate("epip@1.1.1-nc", dirPath, b) }

func benchmarkValidate(version, filePath string, b *testing.B) {
	for i := 0; i < b.N; i++ {
		validation, err := NewValidation()
		if err != nil {
			b.Fatal(err)
		}

		validation.AddScript(scripts["xsd"], map[string]interface{}{"schema": version})

		f, err := os.Open(filePath)
		if err != nil {
			b.Fatal(err)
		}

		fs, err := f.Stat()
		if err != nil {
			b.Fatal(err)
		}

		if !fs.IsDir() {
			validation.AddReader(fs.Name(), f)
		} else {
			entries, err := f.ReadDir(0)
			if err != nil {
				b.Fatal(err)
			}

			for _, entry := range entries {
				if entry.IsDir() || path.Ext(entry.Name()) != ".xml" {
					continue
				}

				fp := filePath + "/" + entry.Name()
				f, err := os.Open(fp)
				if err != nil {
					b.Fatal(err)
				}

				if err := validation.AddReader(fp, f); err != nil {
					b.Fatal(err)
				}
			}
		}

		if _, err := validation.Validate(context.Background()); err != nil {
			b.Fatal(err)
		}
	}
}

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
