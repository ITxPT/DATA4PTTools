package greenlight

import (
	"regexp"
	"strings"

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
	if node != nil {
		ctx.SetContextNode(node)
	}

	return xpath.NodeList(ctx.Find(pattern))
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

func xsdValidateSchema(schema *xsd.Schema, document types.Document) (int, []string) {
	errorStrings := []string{}
	errorCount, errors := schema.Validate(document)

	for _, err := range errors {
		errorStrings = append(errorStrings, err.Error())
	}

	return errorCount, errorStrings
}

func xpathJoin(values ...string) string {
	for i, v := range values {
		if xpathEleRe.MatchString(v) {
			values[i] = "netex:" + v
		}
	}
	return strings.Join(values, "/")
}
