package xml

import (
	"github.com/concreteit/greenlight/internal"
)

type Collection struct {
	data []Node
}

func NewCollection() *Collection {
	return &Collection{
		data: []Node{},
	}
}

func (s *Collection) Add(node Node) {
	s.data = append(s.data, node)
}

func (c *Collection) find(q string) ([]Node, error) {
	nodes := []Node{}
	for _, node := range c.data {
		rnodes, err := node.find(q)
		if err != nil && err != ErrNodeNotFound {
			return nil, err
		}

		nodes = append(nodes, rnodes...)
	}

	if len(nodes) == 0 {
		return nil, ErrNodeNotFound
	}

	return nodes, nil
}

func (c *Collection) first(q string) (Node, error) {
	for _, node := range c.data {
		rnodes, err := node.find(q)
		if err != nil && err != ErrNodeNotFound {
			return nil, err
		} else if err == nil {
			return rnodes[0], nil
		}
	}

	return nil, ErrNodeNotFound
}

func (c *Collection) Find(q string) internal.Result {
	return internal.NewResult(c.find(q))
}

func (c *Collection) First(q string) internal.Result {
	return internal.NewResult(c.first(q))
}
