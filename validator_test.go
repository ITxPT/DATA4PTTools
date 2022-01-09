package greenlight

import (
	"log"
	"os"
	"testing"

	"github.com/lestrrat-go/libxml2"
	"github.com/lestrrat-go/libxml2/xpath"
	"github.com/lestrrat-go/libxml2/xsd"
)

const (
	xsdFilePath             = "xsd/NeTEx_publication.xsd"
	xsdNoConstraintFilePath = "xsd/NeTEx_publication-NoConstraint.xsd"
	xmlFileSmallPath        = "testdata/Netherlands/NeTEx_HTM_Rail_2021-11-14_new.xml"
	xmlFileLargePath        = "testdata/Netherlands/NeTEx_RET__20211115-010025_new.xml"

	xmlFileDemo1     = "testdata/demo1.xml"
	xmlFileDemoSmall = "testdata/demo2/line_3_9011005000300000.xml"
	xmlFileDemoLarge = "testdata/Netherlands/NeTEx_ARR_NF_2021-10-22_1257.xml"
)

var (
	validator *Validator
)

func TestMain(m *testing.M) {
	var err error
	validator, err = NewValidator(WithSchemaFile(xsdFilePath))
	if err != nil {
		log.Fatal(err)
	}

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
		validator.ValidateFile(filePath)
	}
}

func BenchmarkValidateFileNLCXX(b *testing.B) {
	benchmarkValidateFile(b, "testdata/Netherlands/NeTEx_CXX_2021-12-12_baseline_2022001_new.xml")
}
func BenchmarkValidateFileNLARR(b *testing.B) {
	benchmarkValidateFile(b, "testdata/Netherlands/NeTEx_ARR_NF_2021-10-22_1257.xml")
}
func BenchmarkValidateFileDemo1(b *testing.B)     { benchmarkValidateFile(b, xmlFileDemo1) }
func BenchmarkValidateFileDemoSmall(b *testing.B) { benchmarkValidateFile(b, xmlFileDemoSmall) }
func TestValidateFileDemoSmall(t *testing.T) {
	v, err := NewValidator(WithSchemaFile(xsdNoConstraintFilePath))
	if err != nil {
		t.Error(err)
	}

	v.ValidateFile(xmlFileDemoSmall)
}

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

		validator.ValidateFiles(files)
	}
}

func BenchmarkValidateDirSwedenOTRAF(b *testing.B) { benchmarkValidateDir(b, "testdata/Sweden/otraf") }
func BenchmarkValidateDirSwedenUL(b *testing.B)    { benchmarkValidateDir(b, "testdata/Sweden/ul") }

type Constraint struct {
	Name     string
	Selector string
	Fields   []string
}

func benchmarkValidateOptimized(b *testing.B) error {
	s, err := xsd.ParseFromFile(xsdNoConstraintFilePath)
	if err != nil {
		return err
	}
	defer s.Free()

	fd, err := os.Open(xmlFileDemoSmall)
	if err != nil {
		return err
	}
	defer fd.Close()

	doc, err := libxml2.ParseReader(fd)
	if err != nil {
		return err
	}
	defer doc.Free()

	if n, _ := s.Validate(doc); n > 0 {
		log.Printf("contains %d errors", n)
	}

	fs, err := os.Open(xsdFilePath)
	if err != nil {
		return err
	}
	defer fs.Close()

	sd, err := libxml2.ParseReader(fs)
	if err != nil {
		return err
	}

	ctx, err := netexContext(sd)
	if err != nil {
		return err
	}

	ucj, err := uniqueConstraintJobs(ctx)
	if err != nil {
		return err
	}

	if err := ctx.SetContextNode(sd); err != nil {
		return err
	}

	if err := ctx.SetContextNode(doc); err != nil {
		return err
	}

	for i := 0; i < len(ucj); i++ {
		job := <-ucj
		ucSlice := xpath.NodeList(ctx.Find(job.Selector))
		log.Print(ucSlice)
	}

	return nil
}

func uniqueConstraintJobs(ctx *xpath.Context) (chan *Constraint, error) {
	res, err := ctx.Find(".//xsd:unique")
	if err != nil {
		return nil, err
	}

	nodeList := res.NodeList()
	jobs := make(chan *Constraint, len(nodeList))
	for _, v := range nodeList {
		if err := ctx.SetContextNode(v); err != nil {
			return nil, err
		}

		name, err := ctx.Find("@name")
		if err != nil {
			return nil, err
		}

		selector, err := ctx.Find(".//xsd:selector/@xpath")
		if err != nil {
			return nil, err
		}

		fields := []string{}
		fieldRes, err := ctx.Find(".//xsd:field")
		if err != nil {
			return nil, err
		}

		for _, node := range fieldRes.NodeList() {
			field, err := node.Find("@xpath")
			if err != nil {
				return nil, err
			}

			fields = append(fields, field.String())
		}

		jobs <- &Constraint{
			Name:     name.String(),
			Selector: selector.String(),
			Fields:   fields,
		}
	}

	return jobs, nil
}

func BenchmarkValidateOptimized(b *testing.B) {
	for n := 0; n < b.N; n++ {
		if err := benchmarkValidateOptimized(b); err != nil {
			b.Error(err)
		}
	}
}
