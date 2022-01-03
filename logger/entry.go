package logger

import (
	"encoding/json"
	"fmt"
	"time"
)

type LogFormat string

const (
	LogFormatPlain LogFormat = "plain"
	LogFormatJSON  LogFormat = "json"
)

type LogEntry struct {
	Timestamp time.Time
	Level     LogLevel
	Tags      TagSlice
	Message   string
}

func (l *LogEntry) String() string {
	return fmt.Sprintf(
		"%s | %s | %s | %s",
		l.Timestamp.Format("2006-01-02 15:04:05"),
		stringFixedWidth(string(l.Level), 5),
		l.Tags.String(),
		l.Message,
	)
}

func (l *LogEntry) MarshalJSON() ([]byte, error) {
	tagSet := map[string]string{}

	for _, tag := range l.Tags {
		tagSet[tag.Field] = tag.Value
	}

	return json.Marshal(map[string]interface{}{
		"ts":      l.Timestamp.UnixMilli(),
		"level":   l.Level,
		"tags":    tagSet,
		"message": l.Message,
	})
}

func (l *LogEntry) Format(format LogFormat) string {
	switch format {
	case LogFormatPlain:
		return l.String()
	case LogFormatJSON:
		v, _ := json.Marshal(l)

		return string(v)
	default:
		return ""
	}
}

func NewLogEntry(level LogLevel, tags TagSlice, message string) LogEntry {
	return LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Tags:      tags,
		Message:   message,
	}
}
