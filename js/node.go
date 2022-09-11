package js

import (
	"fmt"

	"github.com/concreteit/greenlight/internal"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xpath"
)

var (
	ErrNodeNotFound = fmt.Errorf("node(s) not found")
)

type Node struct {
	line    int
	context *xpath.Context
	node    types.Node
	ref     string
}

func NewNode(n types.Node) (*Node, error) {
	ctx, err := newXPathContext(n)
	if err != nil {
		return nil, err
	}

	line, err := n.Line()
	if err != nil {
		return nil, err
	}

	node := &Node{}
	ref := fmt.Sprintf("%p", node)
	node.context = ctx
	node.node = n
	node.line = line
	node.ref = ref

	return node, nil
}

// exported to the js context
func (n *Node) Find(p string) internal.Result    { return internal.NewResult(n.find(p)) }
func (n *Node) First(p string) internal.Result   { return internal.NewResult(n.first(p)) }
func (n *Node) Free()                            { n.context.Free() }
func (n Node) Line() int                         { return n.line }
func (n *Node) Parent() internal.Result          { return internal.NewResult(n.parent()) }
func (n *Node) Ref() string                      { return n.ref }
func (n Node) Value() string                     { return n.node.NodeValue() }
func (n *Node) ValueAt(p string) internal.Result { return internal.NewResult(n.valueAt(p)) }

func (n Node) parent() (*Node, error) {
	parent, err := n.node.ParentNode()
	if err != nil {
		return nil, err
	}

	return NewNode(parent)
}

func (n *Node) find(p string) ([]*Node, error) {
	// have to create a new context due to the risk of reusing pointer in workers
	nn, err := NewNode(n.node)
	if err != nil {
		return nil, err
	}
	defer nn.Free()

	res, err := nn.context.Find(p)
	if err != nil {
		return nil, err
	}

	rnodes := res.NodeList()
	nodes := []*Node{}

	if len(rnodes) == 0 {
		return nil, ErrNodeNotFound
	}

	for _, rnode := range rnodes {
		node, err := NewNode(rnode)
		if err != nil {
			return nil, err
		}

		nodes = append(nodes, node)
	}

	return nodes, nil
}

func (n *Node) first(p string) (*Node, error) {
	nodes, err := n.find(p)
	if err != nil {
		return nil, err
	}
	for _, node := range nodes[1:] {
		defer node.Free()
	}

	return nodes[0], nil
}

func (n *Node) valueAt(p string) (string, error) {
	node, err := n.first(p)
	if err != nil {
		return "", err
	}

	defer node.Free()

	return node.Value(), nil
}
