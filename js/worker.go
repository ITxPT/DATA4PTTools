package js

import (
	"fmt"

	"github.com/concreteit/greenlight/internal"
)

type Task struct {
	Handler string
	Node    *Node
}

type Worker struct {
	tasks  []Task
	ctx    *Context
	script *Script
}

func NewWorker(ctx *Context) *Worker {
	return &Worker{
		tasks: []Task{},
		ctx:   ctx,
	}
}

func (w *Worker) Queue(handler string, node *Node) {
	w.tasks = append(w.tasks, Task{
		Handler: handler,
		Node:    node,
	})
}

func (w *Worker) Run() internal.Result { // TODO type response object
	n := len(w.tasks)
	queue := internal.NewQueue(0, n)
	for _, t := range w.tasks {
		queue.Add(func() internal.Task {
			return func(id int) internal.Result {
				var handler ContextHandler

				vm, err := w.ctx.script.Runtime()
				if err != nil {
					return internal.NewResult(nil, err)
				}

				if err := vm.ExportTo(vm.Get(t.Handler), &handler); err != nil {
					return internal.NewResult(nil, err)
				}

				fields := map[string]interface{}{
					"scope": fmt.Sprintf("worker-%d", id),
				}
				if w.ctx.fields != nil {
					for k, v := range w.ctx.fields {
						fields[k] = v
					}
				}

				// TODO sigsev issue running this in a worker
				/* callstack := c.runtime.CaptureCallStack(2, nil)
				 * if len(callstack) == 2 {
				 *   frame := callstack[1]
				 *   fields["position"] = frame.Position()
				 * } */

				ctx := &Context{
					emitter: w.ctx.emitter,
					fields:  fields,
					script:  w.ctx.script,

					Config:     w.ctx.Config,
					Document:   w.ctx.Document,
					Collection: w.ctx.Collection,
					Log:        w.ctx.Log,
					Node:       t.Node,
				}
				ctx.Worker = NewWorker(ctx)

				return internal.NewResult(handler(ctx), nil)
			}
		}())
	}

	res := []ScriptError{}
	for _, r := range queue.Run() {
		if v, ok := r.Get().([]interface{}); !ok {
			return internal.NewResult(nil, fmt.Errorf("expected '%v' to be of type []interface{}", r))
		} else {
			for _, vs := range v {
				if vse, ok := vs.(ScriptError); !ok {
					return internal.NewResult(nil, fmt.Errorf("expected '%v' to be of type ScriptError", vs))
				} else {
					res = append(res, vse)
				}
			}
		}
	}

	return internal.NewResult(res, nil)
}
