package greenlight

import (
	"fmt"
	"strings"
	"time"
)

type LogLevel string

const (
	LogLevelDebug = "debug"
	LogLevelInfo  = "info"
	LogLevelWarn  = "warn"
	LogLevelError = "error"
)

func stringFixedWidth(v string, size int) string {
	if n := size - len(v); n > 0 {
		return v + strings.Repeat(" ", n)
	}

	return v
}

type LogTag struct {
	field string
	value string
	width int
}

func (t *LogTag) String() string {
	if t.width > 0 {
		return stringFixedWidth(t.value, t.width)
	}

	return t.value
}

type TagSlice []LogTag

func (ts TagSlice) String() string {
	tags := []string{}

	for _, t := range ts {
		tags = append(tags, t.String())
	}

	return strings.Join(tags, " | ")
}

type LogEntry struct {
	ts     time.Time
	level  LogLevel
	tags   TagSlice
	format string
	args   []interface{}
}

func (l *LogEntry) String() string {
	now := time.Now()
	message := fmt.Sprintf(l.format, l.args...)

	return fmt.Sprintf(
		"%s | %s | %s | %s | %s",
		now.Format("2006-01-02"),
		now.Format("15:04:05"),
		stringFixedWidth(string(l.level), 5),
		l.tags.String(),
		message,
	)
}

func NewLogEntry(level LogLevel, tags TagSlice, format string, args ...interface{}) *LogEntry {
	return &LogEntry{
		ts:     time.Now(),
		level:  level,
		tags:   tags,
		format: format,
		args:   args,
	}
}

type Logger struct {
	tags TagSlice
}

func (l *Logger) AddTag(field, value string, width int) *Logger {
	l.tags = append(l.tags, LogTag{field, value, width})

	return l
}

func (l Logger) Debugf(v string, args ...interface{}) { l.Logf(LogLevelDebug, v, args...) }
func (l Logger) Infof(v string, args ...interface{})  { l.Logf(LogLevelInfo, v, args...) }
func (l Logger) Warnf(v string, args ...interface{})  { l.Logf(LogLevelWarn, v, args...) }
func (l Logger) Errorf(v string, args ...interface{}) { l.Logf(LogLevelError, v, args...) }
func (l Logger) JS() jsObject {
	return jsObject{
		"debug": l.Debugf,
		"info":  l.Infof,
		"warn":  l.Warnf,
		"error": l.Errorf,
	}
}

func (l Logger) Logf(level LogLevel, v string, args ...interface{}) {
	fmt.Println(NewLogEntry(level, l.tags, v, args...))
}

func NewLogger() *Logger {
	return &Logger{}
}