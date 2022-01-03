package logger

import (
	"fmt"
)

type Output interface {
	Log(entry LogEntry)
	SetFormat(format LogFormat)
}

type stdOutput struct {
	format LogFormat
}

func (o stdOutput) Log(entry LogEntry) {
	fmt.Println(entry.Format(o.format))
}

func (o *stdOutput) SetFormat(format LogFormat) {
	o.format = format
}

func DefaultOutput() Output { return &stdOutput{LogFormatPlain} }
