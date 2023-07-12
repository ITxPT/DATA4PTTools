package xml

import (
	"strings"

	"github.com/concreteit/greenlight/internal"
	xmlparser "github.com/tamerh/xml-stream-parser"
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
	exp, attr, hasAttr := splitAttr(q)
	vs, err := o.el.SelectElements(exp)
	if err != nil {
		return nil, err
	} else if vs == nil {
		return nil, ErrNodeNotFound
	}

	eles := []Node{}
	for _, v := range vs {
		if hasAttr {
			if _, ok := v.Attrs[attr]; !ok {
				continue
			}
		}
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

func (o *Element) Line() int { return o.el.Line }

func (o *Element) Parent() internal.Result { return internal.NewResult(o.first("..")) }

func (o *Element) Text() string { return o.el.InnerText }

func (o *Element) TextAt(q string) internal.Result {
	_, attr, hasAttr := splitAttr(q)
	if q == "@"+attr {
		return o.Attr(attr)
	}

	el, err := o.first(q)
	if err != nil {
		return internal.NewResult(nil, err)
	}

	if hasAttr {
		return el.Attr(attr)
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

func splitAttr(q string) (string, string, bool) {
	if exps := strings.Split(q, "/"); len(exps) > 0 {
		if le := exps[len(exps)-1]; len(le) > 0 && le[0] == '@' {
			return strings.Join(exps[:len(exps)-1], "/"), le[1:], true
		}
	}
	return q, "", false
}
