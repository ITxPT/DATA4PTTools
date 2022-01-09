package greenlight

import (
	"regexp"
	"strings"
	"time"

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

func findNodes(ctx *xpath.Context, pattern string, node types.Node) types.NodeList {
	if node != nil {
		ctx.SetContextNode(node)
	}

	return xpath.NodeList(ctx.Find(pattern))
}

func findNode(ctx *xpath.Context, pattern string, node types.Node) types.Node {
	if nodeList := findNodes(ctx, pattern, node); nodeList != nil {
		return nodeList.First()
	}

	return nil
}

func findValue(ctx *xpath.Context, pattern string, nodes types.Node) string {
	if node := findNode(ctx, pattern, nodes); node != nil {
		return node.NodeValue()
	}

	return ""
}

func netexPath(values ...string) string {
	for i, v := range values {
		if xpathEleRe.MatchString(v) {
			values[i] = "netex:" + v
		}
	}

	return strings.Join(values, "/")
}

// TODO xml node should not be directly exposed in runtime
func nodeValue(node types.Node) string {
	return node.NodeValue()
}

func parentNode(node types.Node) types.Node {
	if node == nil {
		return nil
	}

	parent, err := node.ParentNode()
	if err != nil {
		return nil
	}

	return parent
}

func validLocation(name string) (bool, string) {
	_, err := time.LoadLocation(name)
	if err != nil {
		return false, err.Error()
	}

	return true, ""
}

// TODO xsd schema and xml doc should not be directly exposed in runtime
func validateSchema(schema *xsd.Schema, doc types.Document) (int, []string) {
	errorStrings := []string{}
	errorCount, errors := schema.Validate(doc)

	for _, err := range errors {
		errorStrings = append(errorStrings, err.Error())
	}

	return errorCount, errorStrings
}

// TODO xpath context and xml node should not be directly exposed in runtime
func setContextNode(ctx *xpath.Context, node types.Node) string {
	if err := ctx.SetContextNode(node); err != nil {
		return err.Error()
	}

	return ""
}
