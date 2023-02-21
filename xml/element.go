package xml

import (
	"github.com/concreteit/greenlight/internal"
	"github.com/tamerh/xml-stream-parser"
)

type Element struct {
	el *xmlparser.XMLElement
}

func NewElement(el *xmlparser.XMLElement) *Element {
	return &Element{
		el: el,
	}
}

func (o *Element) find(q string) ([]Node, error) {
	vs, err := o.el.SelectElements(q)
	if err != nil {
		return nil, err
	} else if vs == nil {
		return nil, ErrNodeNotFound
	}

	eles := []Node{}
	for _, v := range vs {
		eles = append(eles, NewElement(v))
	}

	return eles, nil
}

func (o *Element) first(q string) (Node, error) {
	eles, err := o.find(q)
	if err != nil {
		return nil, err
	} else if eles == nil || len(eles) == 0 {
		return nil, ErrNodeNotFound
	}

	return eles[0], nil
}

func (o *Element) Find(q string) internal.Result { return internal.NewResult(o.find(q)) }

func (o *Element) First(q string) internal.Result { return internal.NewResult(o.first(q)) }

// TODO
func (o *Element) Line() int { return 0 }

// TODO https://github.com/tamerh/xml-stream-parser/blob/v1.4.0/element.go#L3
func (o *Element) Parent() internal.Result { return internal.NewResult(nil, nil) }

func (o *Element) Text() string { return o.el.InnerText }

func (o *Element) TextAt(q string) internal.Result {
	el, err := o.first(q)
	if err != nil {
		return internal.NewResult(nil, err)
	}

	return internal.NewResult(el.Text(), nil)
}

func (o *Element) Attr(k string) internal.Result {
	v := o.el.Attrs[k]
	if v == "" {
		return internal.NewResult(nil, ErrAttrNotFound)
	}

	return internal.NewResult(v, nil)
}
