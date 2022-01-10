package greenlight

import (
	"time"

	"github.com/lestrrat-go/libxml2/types"
)

func (c *jsContext) findNodes(pattern string, node types.Node) types.NodeList {
	return xpathFindNodes(c.nodeContext, pattern, node)
}

func (c *jsContext) findNode(pattern string, node types.Node) types.Node {
	return xpathFindNode(c.nodeContext, pattern, node)
}

func (c *jsContext) findNodeValue(pattern string, node types.Node) string {
	return xpathFindNodeValue(c.nodeContext, pattern, node)
}

func (c *jsContext) validateSchema() (int, []string) {
	return xsdValidateSchema(c.schema, c.document)
}

func validLocation(name string) (bool, string) {
	_, err := time.LoadLocation(name)
	if err != nil {
		return false, err.Error()
	}

	return true, ""
}
