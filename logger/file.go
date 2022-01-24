package logger

import (
	"log"
	"os"
)

type fileOutput struct {
	format   LogFormat
	filePath string
}

func (o *fileOutput) Log(entry LogEntry) {
	file, err := os.OpenFile(o.filePath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	if _, err := file.WriteString(entry.Format(o.format) + "\n"); err != nil {
		log.Fatal(err)
	}
}

func (o *fileOutput) LogTo(dst string, entry LogEntry) { /* not implemented */ }

func (o *fileOutput) SetFormat(format LogFormat) {
	o.format = format
}

func NewFileOutput(filePath string) (Output, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	return &fileOutput{
		format:   LogFormatPlain,
		filePath: filePath,
	}, nil
}
