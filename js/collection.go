package js

import (
	"sync"

	"github.com/concreteit/greenlight/internal"
)

type Collection struct {
	sync.Mutex
	data map[string]*Node
}

func NewCollection() *Collection {
	return &Collection{
		data: map[string]*Node{},
	}
}

func (s *Collection) Find(p string) internal.Result  { return internal.NewResult(s.find(p)) }
func (s *Collection) First(p string) internal.Result { return internal.NewResult(s.first(p)) }

func (s *Collection) Free() {
	for _, n := range s.data {
		n.Free()
	}
}

func (s *Collection) Get(k string) *Node {
	s.Lock()
	defer s.Unlock()

	return s.data[k]
}

func (s *Collection) Add(node *Node) {
	s.Lock()
	defer s.Unlock()

	s.data[node.Ref()] = node
}

func (c *Collection) find(pattern string) ([]*Node, error) {
	c.Lock()
	defer c.Unlock()

	nodes := []*Node{}
	for _, node := range c.data {
		rnodes, err := node.find(pattern)
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

func (c *Collection) first(p string) (*Node, error) {
	c.Lock()
	defer c.Unlock()

	for _, node := range c.data {
		rnode, err := node.first(p)
		if err != nil && err != ErrNodeNotFound {
			return nil, err
		} else if err == nil {
			return rnode, nil
		}
	}

	return nil, ErrNodeNotFound
}
