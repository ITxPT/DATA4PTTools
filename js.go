package greenlight

import (
	"fmt"
	"log"

	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/concreteit/greenlight/libxml2/xpath"
	"github.com/concreteit/greenlight/libxml2/xsd"
	"github.com/dop251/goja"
)

// TODO this file is in desperate need of refactoring
var (
	jsStandardLib = jsObject{
		"findNodes":      findNodes,
		"findValue":      findValue,
		"nodeValue":      nodeValue,
		"parentNode":     parentNode,
		"validateSchema": validateSchema,
		"setContextNode": setContextNode,
	}
)

type jsObject map[string]interface{}

type jsTaskHandler func(ctx jsObject, stdlib jsObject, args ...interface{}) goja.Value

type JSMainContext struct {
	script *Script
	tasks  []jsTask

	Schema      *xsd.Schema    // TODO should wrap this in order to securely be passed down to script runtime
	Document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	NodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
}

func (c *JSMainContext) JSObject() jsObject {
	return jsObject{
		"log":         c.script.logger.JSObject(),
		"schema":      c.Schema,
		"document":    c.Document,
		"nodeContext": c.NodeContext,
		"queue":       c.Queue,
		"execute":     c.Execute,
	}
}

func (c *JSMainContext) Queue(handler string, node types.Node, args ...interface{}) error {
	ctx, err := netexContext(node)
	if err != nil {
		return err
	}

	c.tasks = append(c.tasks, jsTask{
		context: &JSWorkerContext{
			script: c.script,

			Document:    c.Document,
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
	script *Script

	Document    types.Document // TODO should wrap this in order to securely be passed down to script runtime
	NodeContext *xpath.Context // TODO should wrap this in order to securely be passed down to script runtime
}

func (c *JSWorkerContext) JSObject(id int) jsObject {
	logger := c.script.logger.Copy().
		AddTag("name", fmt.Sprintf("worker-%d", id), 10)

	return jsObject{
		"log":         logger.JSObject(),
		"document":    c.Document,
		"nodeContext": c.NodeContext,
	}
}

type jsTask struct {
	context *JSWorkerContext
	handler string
	args    []interface{}
}

func (t jsTask) Execute(id int) interface{} { // TODO define response type
	var handler jsTaskHandler

	errorSlice := []error{}
	vm := t.context.script.Runtime()
	if err := vm.ExportTo(vm.Get(t.handler), &handler); err != nil {
		log.Print("ERR", err) // TODO handle me
	}

	var name string
	if err := vm.ExportTo(vm.Get("name"), &name); err != nil {
		log.Print("ERR", err) // TODO handle me
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
