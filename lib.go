package greenlight

import (
	"regexp"
	"strings"
	"time"

	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/concreteit/greenlight/libxml2/xpath"
	"github.com/concreteit/greenlight/libxml2/xsd"
)

var (
	xpathEleRe = regexp.MustCompile("^(?i)[a-z]")
)

// TODO xpath context should not be directly exposed in runtime
func findNodes(ctx *xpath.Context, pattern string) (types.NodeList, string) {
	res, err := ctx.Find(pattern)
	if err != nil {
		return nil, err.Error()
	}

	return xpath.NodeList(res, err), ""
}

func findNode(ctx *xpath.Context, pattern string) (types.Node, string) {
	nodeList, err := findNodes(ctx, pattern)
	if err != "" {
		return nil, err
	}

	return nodeList.First(), ""
}

// TODO xpath context should not be directly exposed in runtime
func findValue(ctx *xpath.Context, pattern string) (string, string) {
	n, err := findNode(ctx, pattern)
	if err != "" {
		return "", err
	}
	if n == nil {
		return "", ""
	}

	return n.NodeValue(), ""
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

// TODO xml node should not be directly exposed in runtime
func parentNode(node types.Node) (types.Node, string) {
	n, err := node.ParentNode()
	if err != nil {
		return n, err.Error()
	}

	return n, ""
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
