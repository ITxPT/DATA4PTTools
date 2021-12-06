package greenlight

import (
	"log"
	"os"
	"testing"

	"github.com/concreteit/greenlight/libxml2/xsd"
)

const (
	xsdFilePath      = "xsd/NeTEx_publication.xsd"
	xmlFileSmallPath = "testdata/Netherlands/NeTEx_HTM_Rail_2021-11-14_new.xml"
	xmlFileLargePath = "testdata/Netherlands/NeTEx_RET__20211115-010025_new.xml"

  xmlFileDemo1 = "testdata/demo1.xml"
  xmlFileDemoSmall = "testdata/demo2/line_3_9011005000300000.xml"
  xmlFileDemoLarge = "testdata/Netherlands/NeTEx_ARR_NF_2021-10-22_1257.xml"
)

var (
	schema *xsd.Schema
)

func TestMain(m *testing.M) {
	s, err := xsd.ParseFromFile(xsdFilePath)
	if err != nil {
		log.Fatal(err)
	}
  defer s.Free()

	schema = s

	os.Exit(m.Run())
}

func BenchmarkXSDParse(b *testing.B) {
	for n := 0; n < b.N; n++ {
		if _, err := xsd.ParseFromFile(xsdFilePath); err != nil {
			b.Error(err)
		}
	}
}

func benchmarkValidateFile(b *testing.B, filePath string) {
	for n := 0; n < b.N; n++ {
    s,err:=xsd.ParseFromFile(xsdFilePath)
    if err != nil {
      b.Error(err)
    }

		ValidateFile(s, filePath)
	}
}

func BenchmarkValidateFileNLCXX(b *testing.B) { benchmarkValidateFile(b, "testdata/Netherlands/NeTEx_CXX_2021-12-12_baseline_2022001_new.xml") }
func BenchmarkValidateFileNLARR(b *testing.B) { benchmarkValidateFile(b, "testdata/Netherlands/NeTEx_ARR_NF_2021-10-22_1257.xml") }
func BenchmarkValidateFileDemo1(b *testing.B) { benchmarkValidateFile(b, xmlFileDemo1) }
func BenchmarkValidateFileDemoSmall(b *testing.B) { benchmarkValidateFile(b, xmlFileDemoSmall) }

func benchmarkValidateDir(b *testing.B, dir string) {
	for n := 0; n < b.N; n++ {
		fileEntries, err := os.ReadDir(dir)
		if err != nil {
			b.Error(err)
		}

		files := []string{}
		for _, entry := range fileEntries {
			if !entry.IsDir() {
				files = append(files, dir+"/"+entry.Name())
			}
		}

		ValidateFiles(schema, files)
	}
}

func BenchmarkValidateDirSwedenOTRAF(b *testing.B) { benchmarkValidateDir(b, "testdata/Sweden/otraf") }
func BenchmarkValidateDirSwedenUL(b *testing.B) { benchmarkValidateDir(b, "testdata/Sweden/ul") }
