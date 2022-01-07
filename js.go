package greenlight

import (
	"fmt"
	"sync"

	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/concreteit/greenlight/libxml2/xpath"
	"github.com/concreteit/greenlight/libxml2/xsd"
	"github.com/concreteit/greenlight/logger"
	"github.com/dop251/goja"
)

// TODO this file is in desperate need of refactoring
var (
	jsStandardLib = jsObject{
		"xpath": jsObject{
			"find":      findNodes,  // find nodes
			"first":     findNode,   // find the first node
			"findValue": findValue,  // find the first node and return its value
			"join":      netexPath,  // join xpath pattern
			"parent":    parentNode, // get scope parent
			"value":     nodeValue,  // extract node value
		},
		"time": jsObject{
			"validLocation": validLocation,
		},
		"xsd": jsObject{
			"validate": validateSchema,
		},
		"setContextNode": setContextNode, // TODO should be scoped out
	}
)

type jsObject map[string]interface{}

type jsTaskHandler func(ctx jsObject, stdlib jsObject, args ...interface{}) goja.Value

type JSMainContext struct {
	rw     sync.Mutex
	script *Script
	logger *logger.Logger
	tasks  []jsTask

	Schema      *xsd.Schema    // TODO should wrap this in order to securely be passed down to script runtime
	Document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	Documents   map[string]types.Document
	NodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
}

func (c *JSMainContext) JSObject() jsObject {
	return jsObject{
		"document":       c.Document,
		"execute":        c.Execute,
		"importDocument": c.ImportDocument,
		"log":            jsLogger(c.logger),
		"nodeContext":    c.NodeContext,
		"queue":          c.Queue,
		"schema":         c.Schema,
	}
}

func (c *JSMainContext) ImportDocument(name string) (*xpath.Context, string) {
	c.rw.Lock()
	defer c.rw.Unlock()

	doc := c.Documents[name]
	if doc == nil {
		return nil, "document not found"
	}

	ctx, err := netexContext(doc)
	if err != nil {
		return nil, err.Error()
	}

	return ctx, ""
}

func (c *JSMainContext) Queue(handler string, node types.Node, args ...interface{}) error {
	ctx, err := netexContext(node)
	if err != nil {
		return err
	}

	c.tasks = append(c.tasks, jsTask{
		context: &JSWorkerContext{
			script:      c.script,
			logger:      c.logger,
			Document:    c.Document,
			Documents:   c.Documents,
			NodeContext: ctx,
		},
		handler: handler,
		args:    args,
	})

	return nil
}

func (c *JSMainContext) Execute() []string {
	numTasks := len(c.tasks)
	tasks := make(chan task, numTasks)
	results := make(chan interface{}, numTasks)

	startWorkers(tasks, results)

	for _, jst := range c.tasks {
		tasks <- jst
	}
	close(tasks)

	errors := []string{}
	for i := 0; i < numTasks; i++ {
		if errSlice, ok := (<-results).([]error); ok {
			for _, err := range errSlice {
				errors = append(errors, err.Error())
			}
		}
	}

	return errors
}

type JSWorkerContext struct {
	script      *Script
	logger      *logger.Logger
	Document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	Documents   map[string]types.Document
	NodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
}

func (c *JSWorkerContext) JSObject(id int) jsObject {
	l := c.logger.Copy()
	l.AddTag(logger.NewTag("name", fmt.Sprintf("worker-%d", id), logger.WithTagWidth(10)))

	return jsObject{
		"document":       c.Document,
		"importDocument": c.ImportDocument,
		"log":            jsLogger(l),
		"nodeContext":    c.NodeContext,
	}
}

func (c *JSWorkerContext) ImportDocument(name string) (*xpath.Context, string) {
	doc := c.Documents[name]
	if doc == nil {
		return nil, "document not found"
	}

	ctx, err := netexContext(doc)
	if err != nil {
		return nil, err.Error()
	}

	return ctx, ""
}

type jsTask struct {
	context *JSWorkerContext
	handler string
	args    []interface{}
}

func (t jsTask) Execute(id int) interface{} { // TODO define response type
	var handler jsTaskHandler

	errorSlice := []error{}
	vm, err := t.context.script.Runtime()
	if err != nil {
		return []string{err.Error()}
	}

	if err := vm.ExportTo(vm.Get(t.handler), &handler); err != nil {
		return []string{err.Error()}
	}

	if res := handler(t.context.JSObject(id), jsStandardLib, t.args...); res != nil {
		intSlice, ok := res.Export().([]interface{})
		if !ok {
			return nil
		}

		for _, v := range intSlice {
			if err, ok := v.(string); ok {
				errorSlice = append(errorSlice, fmt.Errorf(err))
			}
		}
	}

	return errorSlice
}

func jsLogger(l *logger.Logger) jsObject {
	return jsObject{
		"debug": l.Debugf,
		"info":  l.Infof,
		"warn":  l.Warnf,
		"error": l.Errorf,
	}
}
