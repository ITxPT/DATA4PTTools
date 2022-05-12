package greenlight

import (
	"fmt"
	"sync"

	"github.com/dop251/goja"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xpath"
	"github.com/lestrrat-go/libxml2/xsd"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// TODO this file is in desperate need of refactoring
var (
	jsStandardLib = jsObject{
		"time": jsObject{
			"validLocation": validLocation,
		},
		"xpath": jsObject{
			"find":      xpathFindNodes,
			"first":     xpathFindNode,
			"findValue": xpathFindNodeValue,
			"parent":    xpathNodeParent,
			"value":     xpathNodeValue,
			"join":      xpathJoin,
		},
		"xsd": jsObject{
			"validate": xsdValidateSchema,
		},
	}
)

type jsObject map[string]interface{}

func (o *jsObject) Set(field string, value interface{}) {
	(*o)[field] = value
}

func (o *jsObject) Get(field string) interface{} {
	return (*o)[field]
}

type jsTaskHandler func(ctx jsObject, stdlib jsObject, args ...interface{}) goja.Value // TODO fix response value

type jsContext struct {
	rw          sync.Mutex
	script      *Script
	context     *ValidationContext
	logger      *zap.Logger
	tasks       []jsTask
	schema      *xsd.Schema // TODO should wrap this in order to securely be passed down to script runtime
	name        string
	document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	nodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
	node        types.Node
}

func (c *jsContext) log(level zapcore.Level, v string, fieldMaps ...map[string]interface{}) {
	fields := []zap.Field{}
	if fieldMaps != nil {
		for _, m := range fieldMaps {
			if m == nil {
				continue
			}
			for k, v := range m {
				fields = append(fields, zap.Any(k, v))
			}
		}
	}

	switch level {
	case zapcore.DebugLevel:
		c.logger.Debug(v, fields...)
	case zapcore.InfoLevel:
		c.logger.Info(v, fields...)
	case zapcore.WarnLevel:
		c.logger.Warn(v, fields...)
	case zapcore.ErrorLevel:
		c.logger.Error(v, fields...)
	}

	c.context.addProgress(c.name, c.script.name, v, 0, "running")
}

func (c *jsContext) object(id int) jsObject {
	fields := map[string]interface{}{
		"script":   c.script.name,
		"document": c.name,
	}
	if id != 0 {
		fields["namespace"] = fmt.Sprintf("worker-%d", id)
	} else {
		fields["namespace"] = "main"
	}

	o := jsObject{}
	o.Set("document", c.document)
	o.Set("log", jsObject{
		"debug": func(v string, extra jsObject) { c.log(zapcore.DebugLevel, v, extra, fields) },
		"info":  func(v string, extra jsObject) { c.log(zapcore.InfoLevel, v, extra, fields) },
		"warn":  func(v string, extra jsObject) { c.log(zapcore.WarnLevel, v, extra, fields) },
		"error": func(v string, extra jsObject) { c.log(zapcore.ErrorLevel, v, extra, fields) },
	})
	o.Set("node", c.node)
	o.Set("schema", c.schema)
	o.Set("worker", jsObject{
		"execute": c.Execute,
		"queue":   c.Queue,
	})
	o.Set("xsd", jsObject{
		"validate": c.validateSchema,
	})
	o.Set("xpath", jsObject{
		"find":      c.findNodes,
		"first":     c.findNode,
		"findValue": c.findNodeValue,
		"parent":    xpathNodeParent,
		"value":     xpathNodeValue,
		"join":      xpathJoin,
		"line":      xpathNodeLine,
	})

	return o
}

func (c *jsContext) importDocument(name string) *xpath.Context {
	c.rw.Lock()
	defer c.rw.Unlock()

	doc := c.context.documents[name]
	if doc == nil {
		doc = c.context.documents[name+".xml"]
		if doc == nil {
			return nil
		}
	}

	ctx, err := netexContext(doc)
	if err != nil {
		return nil
	}

	return ctx
}

func (c *jsContext) Queue(handler string, node types.Node, args ...interface{}) error {
	ctx, err := netexContext(node)
	if err != nil {
		return err
	}

	c.context.incrProgressCount(c.name)
	c.tasks = append(c.tasks, jsTask{
		context: &jsContext{
			context:     c.context,
			script:      c.script,
			logger:      c.logger,
			name:        c.name,
			document:    c.document,
			node:        node,
			nodeContext: ctx,
		},
		handler: handler,
		args:    args,
	})

	return nil
}

func (c *jsContext) Execute() []interface{} {
	numTasks := len(c.tasks)
	results := make(chan interface{}, numTasks)

	for _, jst := range c.tasks {
		workerPool.Add(func(id int) {
			results <- jst.Execute(id)
		})
	}

	errors := []interface{}{}
	for i := 0; i < numTasks; i++ {
		if errSlice, ok := (<-results).([]interface{}); ok {
			errors = append(errors, errSlice...)
			c.context.incrProgressCompleted(c.name)
		}
	}

	return errors
}

type jsTask struct {
	context *jsContext
	handler string
	args    []interface{}
}

func (t jsTask) Execute(id int) interface{} {
	var handler jsTaskHandler

	vm, err := t.context.script.Runtime()
	if err != nil {
		return map[string]interface{}{"message": err.Error()}
	}

	if err := vm.ExportTo(vm.Get(t.handler), &handler); err != nil {
		return map[string]interface{}{"message": err.Error()}
	}

	if res := handler(t.context.object(id), jsStandardLib, t.args...); res != nil {
		v, ok := res.Export().([]interface{})
		if !ok {
			return nil
		}

		return v
	}

	return nil
}
