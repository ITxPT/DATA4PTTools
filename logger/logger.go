package logger

import (
	"fmt"
)

type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

var (
	logLevelMap = map[LogLevel]int{
		LogLevelDebug: 0,
		LogLevelInfo:  1,
		LogLevelWarn:  2,
		LogLevelError: 3,
	}
)

type Logger struct {
	level   LogLevel
	tags    TagSlice
	outputs []Output
}

func (l *Logger) SetLogLevel(level LogLevel) { l.level = level }

func (l *Logger) Copy() *Logger {
	tags := TagSlice{}
	tags = append(tags, l.tags...)

	return &Logger{
		level:   l.level,
		tags:    tags,
		outputs: append([]Output{}, l.outputs...),
	}
}

func (l *Logger) AddTag(t Tag) {
	for i, tag := range l.tags {
		if tag.Field == t.Field {
			l.tags[i] = t
			return
		}
	}

	l.tags = append(l.tags, t)
}

func (l *Logger) AddOutput(out Output)                { l.outputs = append(l.outputs, out) }
func (l Logger) Debug(args ...interface{})            { l.Log(LogLevelDebug, args...) }
func (l Logger) Debugf(v string, args ...interface{}) { l.Logf(LogLevelDebug, v, args...) }
func (l Logger) Info(args ...interface{})             { l.Log(LogLevelInfo, args...) }
func (l Logger) Infof(v string, args ...interface{})  { l.Logf(LogLevelInfo, v, args...) }
func (l Logger) Warn(v string, args ...interface{})   { l.Log(LogLevelWarn, args...) }
func (l Logger) Warnf(v string, args ...interface{})  { l.Logf(LogLevelWarn, v, args...) }
func (l Logger) Error(v string, args ...interface{})  { l.Log(LogLevelError, args...) }
func (l Logger) Errorf(v string, args ...interface{}) { l.Logf(LogLevelError, v, args...) }

func (l Logger) log(level LogLevel, message string) {
	entry := NewLogEntry(level, l.tags, message)

	if logLevelMap[l.level] <= logLevelMap[level] {
		for _, out := range l.outputs {
			out.Log(entry)
		}
	}
}

func (l Logger) Log(level LogLevel, args ...interface{}) { l.log(level, fmt.Sprint(args...)) }

func (l Logger) Logf(level LogLevel, v string, args ...interface{}) {
	l.log(level, fmt.Sprintf(v, args...))
}

func New() *Logger { return &Logger{} }
