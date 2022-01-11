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
		},
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
