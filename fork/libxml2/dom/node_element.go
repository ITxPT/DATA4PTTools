package dom

import (
	"bytes"

	"github.com/lestrrat-go/libxml2/clib"
	"github.com/lestrrat-go/libxml2/types"
)

// GetAttribute retrieves the value of an attribute
func (n *Element) GetAttribute(name string) (types.Attribute, error) {
	attrNode, err := clib.XMLElementGetAttributeNode(n, name)
	if err != nil {
		return nil, err
	}
	return wrapAttributeNode(attrNode), nil
}

// Attributes returns a list of attributes on a node
func (n *Element) Attributes() ([]types.Attribute, error) {
	attrs, err := clib.XMLElementAttributes(n)
	if err != nil {
		return nil, err
	}
	ret := make([]types.Attribute, len(attrs))
	for i, attr := range attrs {
		ret[i] = wrapAttributeNode(attr)
	}
	return ret, nil
}

// GetNamespaces returns Namespace objects associated with this
// element. WARNING: This method currently returns namespace
// objects which allocates C structures for each namespace.
// Therefore you MUST free the structures, or otherwise you
// WILL leak memory.
func (n *Element) GetNamespaces() ([]types.Namespace, error) {
	list, err := clib.XMLElementNamespaces(n)
	if err != nil {
		return nil, err
	}
	ret := make([]types.Namespace, len(list))
	for i, nsptr := range list {
		ret[i] = wrapNamespaceNode(nsptr)
	}
	return ret, nil
}

// Literal returns a stringified version of this node and its
// children, inclusive.
func (n Element) Literal() (string, error) {
	buf := bytes.Buffer{}
	children, err := n.ChildNodes()
	if err != nil {
		return "", err
	}
	for _, c := range children {
		l, err := c.Literal()
		if err != nil {
			return "", err
		}
		buf.WriteString(l)
	}
	return buf.String(), nil
}
