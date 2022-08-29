package js

import (
	"github.com/concreteit/greenlight/internal"
)

type LogHandler func(fields map[string]interface{})

type Logger struct {
	ctx *Context
}

func NewLogger(ctx *Context) Logger {
	return Logger{
		ctx: ctx,
	}
}

func (l Logger) Log(level, v string, extra internal.M) {
	if l.ctx == nil {
		return
	}

	// TODO type fields(?)
	fields := map[string]interface{}{
		"level":   level,
		"message": v,
	}

	if extra != nil {
		fields["extra"] = extra
	}

	l.ctx.log(fields)
}

func (l Logger) Trace(v string, extra internal.M) { l.Log("trace", v, extra) }

func (l Logger) Debug(v string, extra internal.M) { l.Log("debug", v, extra) }

func (l Logger) Info(v string, extra internal.M) { l.Log("info", v, extra) }

func (l Logger) Warn(v string, extra internal.M) { l.Log("warn", v, extra) }

func (l Logger) Error(v string, extra internal.M) { l.Log("error", v, extra) }
