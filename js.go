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

var (
	xpathContext = jsObject{
		"find":      findNodes,  // find nodes
		"first":     findNode,   // find the first node
		"findValue": findValue,  // find the first node and return its value
		"join":      netexPath,  // join xpath pattern
		"parent":    parentNode, // get scope parent
		"value":     nodeValue,  // extract node value
	}
)

// TODO this file is in desperate need of refactoring
var (
	jsStandardLib = jsObject{
		"xpath": xpathContext, // move to context
		"time": jsObject{
			"validLocation": validLocation,
		},
		"xsd": jsObject{
			"validate": validateSchema,
		},
	}
)

type jsObject map[string]interface{}

type jsTaskHandler func(ctx jsObject, stdlib jsObject, args ...interface{}) goja.Value // TODO fix response value

type jsContext struct {
	rw          sync.Mutex
	script      *Script
	logger      *logger.Logger
	tasks       []jsTask
	schema      *xsd.Schema    // TODO should wrap this in order to securely be passed down to script runtime
	document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	documents   map[string]types.Document
	nodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
	node        types.Node
}

func (c *jsContext) object(id int) jsObject {
	if id != 0 {
		c.logger.AddTag(logger.NewTag("name", fmt.Sprintf("worker-%d", id), logger.WithTagWidth(10)))
	}

	return jsObject{
		"document":       c.document,
		"importDocument": c.importDocument,
		"log": jsObject{
			"debug": c.logger.Debugf,
			"info":  c.logger.Infof,
			"warn":  c.logger.Warnf,
			"error": c.logger.Errorf,
		},
		"nodeContext": c.nodeContext,
		"schema":      c.schema,
		"execute":     c.Execute,
		"queue":       c.Queue,
	}
}

func (c *jsContext) importDocument(name string) *xpath.Context {
	c.rw.Lock()
	defer c.rw.Unlock()

	doc := c.documents[name]
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

	c.tasks = append(c.tasks, jsTask{
		context: &jsContext{
			script:      c.script,
			logger:      c.logger.Copy(),
			document:    c.document,
			documents:   c.documents,
			node:        node,
			nodeContext: ctx,
		},
		handler: handler,
		args:    args,
	})

	return nil
}

func (c *jsContext) Execute() []string {
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

type jsTask struct {
	context *jsContext
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

	if res := handler(t.context.object(id), jsStandardLib, t.args...); res != nil {
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
