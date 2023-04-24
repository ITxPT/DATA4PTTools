package xmlparser

import (
	"bufio"
	"fmt"
	"strings"
)

type XMLParser struct {
	line       int
	reader     *bufio.Reader
	scratch    *scratch
	scratch2   *scratch
	elementMap map[string]map[*XMLElement]bool
}

func Parse(reader *bufio.Reader) (*XMLElement, error) {
	x := &XMLParser{
		reader:     reader,
		scratch:    &scratch{data: make([]byte, 1024)},
		scratch2:   &scratch{data: make([]byte, 1024)},
		elementMap: make(map[string]map[*XMLElement]bool),
	}

	return x.Parse()
}

func (x *XMLParser) Parse() (*XMLElement, error) {
	var element *XMLElement

	if err := x.skipDeclarations(); err != nil {
		return nil, err
	}

	for {
		b, err := x.readByte()
		if err != nil {
			return nil, err
		} else if x.isWS(b) {
			return nil, nil
		}

		if b == '<' {
			if ok, _, err := x.isCDATA(); err != nil {
				return nil, err
			} else if ok {
				continue
			}

			if ok, err := x.isComment(); err != nil {
				return nil, err
			} else if ok {
				continue
			}

			element, _, err = x.startElement()
			if err != nil {
				return nil, err
			}

			ele := x.getElementTree(element)
			ele.elementMap = make(map[string][]*XMLElement)
			for k, v := range x.elementMap {
				eles := []*XMLElement{}
				for el, _ := range v {
					eles = append(eles, el)
				}
				ele.elementMap[k] = eles
			}

			return ele, nil
		}
	}
}

func (x *XMLParser) getElementTree(result *XMLElement) *XMLElement {
	if result.Err != nil {
		return result
	}

	x.scratch2.reset()

	for {
		cur, err := x.readByte()
		if err != nil {
			result.Err = err
			return result
		}

		if cur == '<' {
			if ok, data, err := x.isCDATA(); err != nil {
				result.Err = err
				return result
			} else if ok {
				for _, cd := range data {
					x.scratch2.add(cd)
				}
				continue
			}

			if ok, err := x.isComment(); err != nil {
				result.Err = err
				return result
			} else if ok {
				continue
			}

			if next, err := x.readByte(); err != nil {
				result.Err = err
				return result
			} else if next == '/' { // close tag
				if tag, err := x.closeTagName(); err != nil {
					result.Err = err
					return result
				} else if tag == result.Name {
					if len(result.Childs) == 0 {
						result.InnerText = string(x.scratch2.bytes())
					}
					return result
				}
			} else {
				x.unreadByte()
			}

			element, tagClosed, err := x.startElement()
			if err != nil {
				result.Err = err
				return result
			}
			if !tagClosed {
				element = x.getElementTree(element)
			}

			element.parent = result

			if _, ok := result.Childs[element.Name]; ok {
				result.Childs[element.Name] = append(result.Childs[element.Name], *element)
				result.childs = append(result.childs, element)
			} else {
				var childs []XMLElement
				childs = append(childs, *element)
				if result.Childs == nil {
					result.Childs = map[string][]XMLElement{}
				}
				result.Childs[element.Name] = childs
				result.childs = append(result.childs, element)
			}
		} else {
			x.scratch2.add(cur)
		}
	}
}

func (x *XMLParser) startElement() (*XMLElement, bool, error) {
	x.scratch.reset()

	var prev byte
	var result = &XMLElement{
		Line: x.line + 1,
	}
	defer func() {
		if result == nil || result.Name == "" {
			return
		}
		if x.elementMap[result.Name] == nil {
			x.elementMap[result.Name] = make(map[*XMLElement]bool)
		}
		x.elementMap[result.Name][result] = true
	}()

	for {
		cur, err := x.readByte()
		if err != nil {
			return nil, false, x.defaultError()
		}

		if x.isWS(cur) {
			result.Name = string(x.scratch.bytes())
			names := strings.Split(result.Name, ":")
			if len(names) > 1 {
				result.prefix = names[0]
				result.localName = names[1]
			} else {
				result.localName = names[0]
			}

			x.scratch.reset()
			goto search_close_tag
		}
		if cur == '>' {
			if prev == '/' {
				result.Name = string(x.scratch.bytes()[:len(x.scratch.bytes())-1])
				names := strings.Split(result.Name, ":")
				if len(names) > 1 {
					result.prefix = names[0]
					result.localName = names[1]
				} else {
					result.localName = names[0]
				}

				return result, true, nil
			}

			result.Name = string(x.scratch.bytes())
			names := strings.Split(result.Name, ":")
			if len(names) > 1 {
				result.prefix = names[0]
				result.localName = names[1]
			} else {
				result.localName = names[0]
			}

			return result, false, nil
		}

		x.scratch.add(cur)
		prev = cur
	}

search_close_tag:
	for {
		cur, err := x.readByte()
		if err != nil {
			return nil, false, x.defaultError()
		}
		if x.isWS(cur) {
			continue
		}
		if cur == '=' {
			if result.Attrs == nil {
				result.Attrs = map[string]string{}
			}

			cur, err := x.readByte()
			if err != nil {
				return nil, false, x.defaultError()
			}
			if !(cur == '"' || cur == '\'') {
				return nil, false, x.defaultError()
			}

			attr := string(x.scratch.bytes())
			attrVal, err := x.string(cur)
			if err != nil {
				return nil, false, x.defaultError()
			}

			result.Attrs[attr] = attrVal
			result.attrs = append(result.attrs, &xmlAttr{name: attr, value: attrVal})
			x.scratch.reset()
			continue
		}

		if cur == '>' { //if tag name not found
			if prev == '/' { //tag special close
				return result, true, nil
			}

			return result, false, nil
		}

		x.scratch.add(cur)
		prev = cur
	}
}

func (x *XMLParser) isComment() (bool, error) {
	if c, err := x.readByte(); err != nil {
		return false, err
	} else if c != '!' {
		x.unreadByte()
		return false, nil
	}

	d, err := x.readByte()
	if err != nil {
		return false, err
	}

	e, err := x.readByte()
	if err != nil {
		return false, err
	}
	if d != '-' || e != '-' {
		err = x.defaultError()
		return false, err
	}

	// skip part
	x.scratch.reset()
	for {
		c, err := x.readByte()
		if err != nil {
			return false, err
		} else if c == '>' && len(x.scratch.bytes()) > 1 && x.scratch.bytes()[len(x.scratch.bytes())-1] == '-' && x.scratch.bytes()[len(x.scratch.bytes())-2] == '-' {
			return true, nil
		}

		x.scratch.add(c)
	}
}

func (x *XMLParser) isCDATA() (bool, []byte, error) {
	b, err := x.reader.Peek(2)
	if err != nil {
		return false, nil, err
	}
	if b[0] != '!' {
		return false, nil, nil
	}
	if b[1] != '[' {
		return false, nil, nil
	}

	if _, err = x.readByte(); err != nil {
		return false, nil, err
	}
	if _, err = x.readByte(); err != nil {
		return false, nil, err
	}

	c, err := x.readByte()
	if err != nil {
		return false, nil, err
	}
	if c != 'C' {
		err = x.defaultError()
		return false, nil, err
	}

	c, err = x.readByte()
	if err != nil {
		return false, nil, err
	}
	if c != 'D' {
		err = x.defaultError()
		return false, nil, err
	}

	c, err = x.readByte()
	if err != nil {
		return false, nil, err
	}
	if c != 'A' {
		err = x.defaultError()
		return false, nil, err
	}

	c, err = x.readByte()
	if err != nil {
		return false, nil, err
	}
	if c != 'T' {
		err = x.defaultError()
		return false, nil, err
	}

	c, err = x.readByte()
	if err != nil {
		return false, nil, err
	}
	if c != 'A' {
		err = x.defaultError()
		return false, nil, err
	}

	c, err = x.readByte()
	if err != nil {
		return false, nil, err
	}

	if c != '[' {
		err = x.defaultError()
		return false, nil, err
	}

	// this is possibly cdata // ]]>
	x.scratch.reset()
	for {
		c, err := x.readByte()
		if err != nil {
			return false, nil, err
		}
		if c == '>' && len(x.scratch.bytes()) > 1 && x.scratch.bytes()[len(x.scratch.bytes())-1] == ']' && x.scratch.bytes()[len(x.scratch.bytes())-2] == ']' {
			return true, x.scratch.bytes()[:len(x.scratch.bytes())-2], nil
		}

		x.scratch.add(c)
	}
}

func (x *XMLParser) skipDeclarations() error {
scanDeclarations:
	for {
		// when identifying a xml declaration we need to know 2 bytes ahead. Unread works 1 byte at a time so we use Peek and read together.
		a, err := x.reader.Peek(1)
		if err != nil {
			return err
		}

		if a[0] == '<' {
			b, err := x.reader.Peek(2)
			if err != nil {
				return err
			}
			if b[1] == '!' || b[1] == '?' { // either comment or decleration
				if _, err = x.readByte(); err != nil {
					return err
				}
				if _, err = x.readByte(); err != nil {
					return err
				}

				c, err := x.readByte()
				if err != nil {
					return err
				}

				d, err := x.readByte()
				if err != nil {
					return err
				}

				if c == '-' && d == '-' {
					goto skipComment
				} else {
					goto skipDeclaration
				}
			} else {
				return nil
			}
		}

		// read peaked byte
		if _, err := x.readByte(); err != nil {
			return err
		}
	}

skipComment:
	x.scratch.reset()
	for {
		c, err := x.readByte()
		if err != nil {
			return err
		}
		if c == '>' && len(x.scratch.bytes()) > 1 && x.scratch.bytes()[len(x.scratch.bytes())-1] == '-' && x.scratch.bytes()[len(x.scratch.bytes())-2] == '-' {
			goto scanDeclarations
		}

		x.scratch.add(c)
	}

skipDeclaration:
	depth := 1
	for {
		if c, err := x.readByte(); err != nil {
			return err
		} else if c == '>' {
			depth--
			if depth == 0 {
				goto scanDeclarations
			}
			continue
		} else if c == '<' {
			depth++
		}
	}
}

func (x *XMLParser) closeTagName() (string, error) {
	x.scratch.reset()
	for {
		c, err := x.readByte()
		if err != nil {
			return "", err
		}
		if c == '>' {
			return string(x.scratch.bytes()), nil
		}
		if !x.isWS(c) {
			x.scratch.add(c)
		}
	}
}

func (x *XMLParser) readByte() (byte, error) {
	by, err := x.reader.ReadByte()
	if err != nil {
		return 0, err
	}
	if by == '\n' {
		x.line++
	}
	return by, nil

}

func (x *XMLParser) unreadByte() error {
	err := x.reader.UnreadByte()
	if err != nil {
		return err
	}
	return nil
}

func (x *XMLParser) isWS(in byte) bool {
	if in == ' ' || in == '\n' || in == '\t' || in == '\r' {
		return true
	}
	return false
}

func (x *XMLParser) defaultError() error {
	err := fmt.Errorf("invalid xml")
	return err
}

func (x *XMLParser) string(start byte) (string, error) {
	x.scratch.reset()
	for {
		c, err := x.readByte()
		if err != nil {
			if err != nil {
				return "", err
			}
		}

		if c == start {
			return string(x.scratch.bytes()), nil
		}

		x.scratch.add(c)
	}
}

type scratch struct {
	data []byte
	fill int
}

func (s *scratch) reset() { s.fill = 0 }

func (s *scratch) bytes() []byte { return s.data[0:s.fill] }

func (s *scratch) grow() {
	ndata := make([]byte, cap(s.data)*2)
	copy(ndata, s.data[:])
	s.data = ndata
}

func (s *scratch) add(c byte) {
	if s.fill+1 >= cap(s.data) {
		s.grow()
	}
	s.data[s.fill] = c
	s.fill++
}
