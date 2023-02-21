package xml

import (
	"fmt"

	"github.com/concreteit/greenlight/internal"
)

var (
	ErrNodeNotFound = fmt.Errorf("element not found")
	ErrAttrNotFound = fmt.Errorf("attr not found")
)

type Node interface {
	find(q string) ([]Node, error)
	first(q string) (Node, error)

	Find(q string) internal.Result
	First(q string) internal.Result
	Line() int
	Parent() internal.Result
	Text() string
	TextAt(q string) internal.Result
	Attr(k string) internal.Result
}
