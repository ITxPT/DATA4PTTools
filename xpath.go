package greenlight

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/lestrrat-go/libxml2/clib"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xpath"
	"github.com/lestrrat-go/libxml2/xsd"
)

var (
	xpathEleRe = regexp.MustCompile("^(?i)[a-z]")
)

func netexContext(n types.Node) (*xpath.Context, error) {
	ctx, err := xpath.NewContext(n)
	if err != nil {
		return nil, err
	}

	if err := ctx.RegisterNS("xsd", "http://www.w3.org/2001/XMLSchema"); err != nil {
		return nil, err
	}
	if err := ctx.RegisterNS("netex", "http://www.netex.org.uk/netex"); err != nil {
		return nil, err
	}

	return ctx, nil
}

func xpathFindNodes(ctx *xpath.Context, pattern string, node types.Node) types.NodeList {
	validContext := ctx
	if node != nil {
		validContext, _ = netexContext(node)
	}

	return xpath.NodeList(validContext.Find(pattern))
}

func xpathFindNode(ctx *xpath.Context, pattern string, node types.Node) types.Node {
	if nodeList := xpathFindNodes(ctx, pattern, node); nodeList != nil {
		return nodeList.First()
	}

	return nil
}

func xpathFindNodeValue(ctx *xpath.Context, pattern string, node types.Node) string {
	if node := xpathFindNode(ctx, pattern, node); node != nil {
		return node.NodeValue()
	}

	return ""
}

func xpathNodeLine(node types.Node) int {
	if node == nil {
		return 0
	}

	n, err := node.Line()
	if err != nil {
		fmt.Println(err)
	}

	return n
}

func xpathNodeParent(node types.Node) types.Node {
	if node == nil {
		return nil
	}

	parent, err := node.ParentNode()
	if err != nil {
		return nil
	}

	return parent
}

func xpathNodeValue(node types.Node) string {
	if node == nil {
		return ""
	}

	return node.NodeValue()
}

func xsdValidateSchema(schema *xsd.Schema, document types.Document) (int, []map[string]interface{}) {
	schemaErrors := []map[string]interface{}{}
	errorCount, errors := schema.Validate(document)

	for _, err := range errors {
		if sve, ok := err.(clib.SchemaValidationError); ok {
			schemaErrors = append(schemaErrors, map[string]interface{}{
				"type":    "xsd",
				"message": sve.Message,
				"line":    sve.Line,
			})
		}
	}

	return errorCount, schemaErrors
}

func xpathJoin(values ...string) string {
	for i, v := range values {
		if xpathEleRe.MatchString(v) {
			values[i] = "netex:" + v
		}
	}
	return strings.Join(values, "/")
}
