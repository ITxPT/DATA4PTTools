package libxml2

import (
	"fmt"
	"os"
	"testing"

	"github.com/lestrrat-go/libxml2/parser"
	"github.com/lestrrat-go/libxml2/xpath"
	"github.com/stretchr/testify/assert"
)

func TestEncoding(t *testing.T) {
	for _, enc := range []string{`utf-8`, `sjis`, `euc-jp`} {
		fn := fmt.Sprintf(`test/%s.xml`, enc)
		f, err := os.Open(fn)
		if err != nil {
			t.Errorf("Failed to open %s: %s", fn, err)
			return
		}
		defer f.Close()

		p := parser.New()
		doc, err := p.ParseReader(f)
		if err != nil {
			t.Errorf("Failed to parse %s: %s", fn, err)
			return
		}

		if doc.Encoding() != enc {
			t.Errorf("Expected encoding %s, got %s", enc, doc.Encoding())
			return
		}
	}
}

func TestRegressionGH7(t *testing.T) {
	doc, err := ParseHTMLString(`<!DOCTYPE html>
<html>
<body>
<div>
<style>
</style>
    1234
</div>
</body>
</html>`)

	if !assert.NoError(t, err, "ParseHTMLString should succeed") {
		return
	}

	nodes := xpath.NodeList(doc.Find(`./body/div`))
	if !assert.NotEmpty(t, nodes, "Find should succeed") {
		return
	}

	v, err := nodes.Literal()
	if !assert.NoError(t, err, "Literal() should succeed") {
		return
	}
	if !assert.NotEmpty(t, v, "Literal() should return some string") {
		return
	}
	t.Logf("v = '%s'", v)
}
