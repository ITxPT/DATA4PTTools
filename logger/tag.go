package logger

import (
	"strings"
)

type TagSlice []Tag

func (ts TagSlice) String() string {
	tags := []string{}

	for _, t := range ts {
		tags = append(tags, t.String())
	}

	return strings.Join(tags, " | ")
}

type TagOption func(t *Tag)

type Tag struct {
	Field string
	Value string

	width int
}

func (t *Tag) String() string {
	if t.width > 0 {
		return stringFixedWidth(t.Value, t.width)
	}

	return t.Value
}

func NewTag(field, value string, opts ...TagOption) Tag {
	t := Tag{
		Field: field,
		Value: value,
		width: 0,
	}

	if opts != nil {
		for _, opt := range opts {
			opt(&t)
		}
	}

	return t
}

func WithTagWidth(v int) TagOption {
	return func(t *Tag) {
		t.width = v
	}
}

func WithTagMaxWidth(strSlice []string) TagOption {
	return func(t *Tag) {
		i := 0
		for _, v := range strSlice {
			vl := len(v)
			if vl > i {
				i = vl
			}
		}

		t.width = i
	}
}

func stringFixedWidth(v string, size int) string {
	if n := size - len(v); n > 0 {
		return v + strings.Repeat(" ", n)
	}

	return v
}
