package greenlight

import (
	"fmt"
	"sync"

	"github.com/concreteit/greenlight/logger"
	"github.com/dop251/goja"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xpath"
	"github.com/lestrrat-go/libxml2/xsd"
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

type jsTaskHandler func(ctx jsObject, stdlib jsObject, args ...interface{}) goja.Value // TODO fix response value

type jsContext struct {
	rw          sync.Mutex
	script      *Script
	context     *ValidationContext
	logger      *logger.Logger
	tasks       []jsTask
	schema      *xsd.Schema // TODO should wrap this in order to securely be passed down to script runtime
	name        string
	document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	nodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
	node        types.Node
}

func (c *jsContext) log(level logger.LogLevel, v string, args ...interface{}) {
	msg := fmt.Sprintf(v, args...)
	c.context.addProgress(c.name, c.script.name, msg, 0)
	c.logger.Logf(level, v, args...)
}

func (c *jsContext) object(id int) jsObject {
	if id != 0 {
		c.logger.AddTag(logger.NewTag("name", fmt.Sprintf("worker-%d", id), logger.WithTagWidth(10)))
	}

	return jsObject{
		"document":       c.document,
		"importDocument": c.importDocument,
		"log": jsObject{
			"debug": func(v string, args ...interface{}) { c.log(logger.LogLevelDebug, v, args...) },
			"info":  func(v string, args ...interface{}) { c.log(logger.LogLevelInfo, v, args...) },
			"warn":  func(v string, args ...interface{}) { c.log(logger.LogLevelWarn, v, args...) },
			"error": func(v string, args ...interface{}) { c.log(logger.LogLevelError, v, args...) },
		},
		"nodeContext": c.nodeContext,
		"node":        c.node,
		"schema":      c.schema,
		"worker": jsObject{
			"execute": c.Execute,
			"queue":   c.Queue,
		},
		"xsd": jsObject{
			"validate": c.validateSchema,
		},
		"xpath": jsObject{
			"find":      c.findNodes,
			"first":     c.findNode,
			"findValue": c.findNodeValue,
			"parent":    xpathNodeParent,
			"value":     xpathNodeValue,
			"join":      xpathJoin,
			"line":      xpathNodeLine,
		},
	}
}

func (c *jsContext) importDocument(name string) *xpath.Context {
	c.rw.Lock()
	defer c.rw.Unlock()

	doc := c.context.documents[name]
	if doc == nil {
		return nil
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

	c.context.progress[c.name].count += 1
	c.tasks = append(c.tasks, jsTask{
		context: &jsContext{
			context:     c.context,
			script:      c.script,
			logger:      c.logger.Copy(),
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
	tasks := make(chan task, numTasks)
	results := make(chan interface{}, numTasks)

	startWorkers(tasks, results)

	for _, jst := range c.tasks {
		tasks <- jst
	}
	close(tasks)

	errors := []interface{}{}
	for i := 0; i < numTasks; i++ {
		if errSlice, ok := (<-results).([]interface{}); ok {
			errors = append(errors, errSlice...)
			c.context.progress[c.name].completed += 1
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
