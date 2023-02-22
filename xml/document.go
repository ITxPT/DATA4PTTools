package xml

import (
	"bufio"
	"math"
	"os"
	"sync"

	"github.com/concreteit/greenlight/internal"
	"github.com/tamerh/xml-stream-parser"
)

type Document struct {
	sync.RWMutex
	el   *Element
	file *os.File

	Name     string
	FilePath string
}

func NewDocument(name, filePath string) (*Document, error) {
	d := &Document{
		Name:     name,
		FilePath: filePath,
	}

	return d, nil
}

func (d *Document) Close() {
	d.Lock()
	defer d.Unlock()

	d.el = nil
	if d.file != nil {
		d.file.Close()
	}
}

func (d *Document) newElement() (*Element, error) {
	d.Lock()
	defer d.Unlock()

	if d.el == nil {
		f, err := os.Open(d.FilePath)
		if err != nil {
			return nil, err
		}
		defer f.Close()

		br := bufio.NewReaderSize(f, math.MaxUint16)
		// TODO fix first element "PublicationDelivery"
		parser := xmlparser.NewXMLParser(br, "PublicationDelivery").EnableXpath()
		el := <-parser.Stream()
		if el == nil {
			return nil, ErrNodeNotFound
		}

		d.el = NewElement(el)
	}

	return d.el, nil
}

func (d *Document) find(q string) ([]Node, error) {
	el, err := d.newElement()
	if err != nil {
		return nil, err
	}

	return el.find(q)
}

func (d *Document) first(q string) (Node, error) {
	el, err := d.newElement()
	if err != nil {
		return nil, err
	}

	return el.first(q)
}

func (d *Document) Find(q string) internal.Result { return internal.NewResult(d.find(q)) }

func (d *Document) First(q string) internal.Result { return internal.NewResult(d.first(q)) }

// TODO
func (d *Document) Line() int {
	_, err := d.newElement()
	if err != nil {
		return 0
	}

	return 0
}

func (d *Document) Parent() internal.Result {
	_, err := d.newElement()
	if err != nil {
		return internal.NewResult(nil, err)
	}

	return internal.NewResult(nil, nil)
}

func (d *Document) Text() string {
	el, err := d.newElement()
	if err != nil {
		return ""
	}

	return el.Text()
}

func (d *Document) TextAt(q string) internal.Result {
	el, err := d.newElement()
	if err != nil {
		return internal.NewResult(nil, err)
	}

	return el.TextAt(q)
}

func (d *Document) Attr(k string) internal.Result {
	el, err := d.newElement()
	if err != nil {
		return internal.NewResult(nil, err)
	}

	return el.Attr(k)
}
