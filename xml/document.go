package xml

import (
	"bufio"
	"math"
	"os"

	"github.com/tamerh/xml-stream-parser"
)

type Document struct {
	*Element
	file *os.File

	Name     string
	FilePath string
}

func NewDocument(name, filePath string) (*Document, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}

	br := bufio.NewReaderSize(f, math.MaxUint16)
	// TODO fix first element "PublicationDelivery"
	parser := xmlparser.NewXMLParser(br, "PublicationDelivery").EnableXpath()

	el := <-parser.Stream()
	if el == nil {
		return nil, ErrNodeNotFound
	}

	return &Document{
		Element:  NewElement(el),
		file:     f,
		Name:     name,
		FilePath: filePath,
	}, nil
}

func (d *Document) Close() { d.file.Close() }
