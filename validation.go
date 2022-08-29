package greenlight

import (
	"context"
	"io"

	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/js"
	"github.com/lestrrat-go/libxml2"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/matoous/go-nanoid/v2"
)

type ScriptEnv struct {
	script *js.Script
	cfg    map[string]interface{}
}

type Validation struct {
	id           string
	emitter      *internal.Emitter
	documentMap  map[string]types.Document
	documentColl *js.Collection
	scripts      map[string]ScriptEnv
	results      []*ValidationResult
}

func (v *Validation) Results() []*ValidationResult { return v.results }

func (v *Validation) Emit(t internal.EventType, data map[string]interface{}) {
	v.emitter.Emit(t, data)
}

func (v *Validation) Subscribe(handler internal.EventHandler) int {
	return v.emitter.Subscribe(handler)
}

func (v *Validation) Unsubscribe(id int) {
	v.emitter.Unsubscribe(id)
}

func (v *Validation) AddDocument(name string, doc types.Document) error {
	node, err := js.NewNode(doc)
	if err != nil {
		return err
	}

	v.documentMap[name] = doc
	v.documentColl.Add(node)

	return nil
}

func (v *Validation) AddReader(name string, reader io.Reader) error {
	doc, err := libxml2.ParseReader(reader)
	if err != nil {
		return err
	}

	return v.AddDocument(name, doc)
}

func (v *Validation) AddScript(script *js.Script, cfg map[string]interface{}) {
	v.scripts[script.Name()] = ScriptEnv{
		script: script,
		cfg:    cfg,
	}
}

// TODO fix result
func (v *Validation) Validate(ctx context.Context) internal.Result {
	v.Emit(internal.EventTypeValidationStart, nil)
	defer v.documentColl.Free()
	defer v.emitter.Close()
	defer v.Emit(internal.EventTypeValidationStop, nil)

	n := len(v.documentMap)
	queue := internal.NewQueue(0, n)
	for name, doc := range v.documentMap {
		queue.Add(func(name string, doc types.Document) internal.Task {
			return func(id int) internal.Result {
				return internal.NewResult(v.validateDocument(name, doc), nil)
			}
		}(name, doc))
	}

	return internal.NewResult(queue.Run(), nil)
}

func (v *Validation) validateDocument(name string, doc types.Document) []internal.Result {
	n := len(v.scripts)
	queue := internal.NewQueue(0, n)
	for _, script := range v.scripts {
		queue.Add(func(env ScriptEnv) internal.Task {
			return func(id int) internal.Result {
				return env.script.Run(name, doc, v.emitter, v.documentColl, env.cfg)
			}
		}(script))
	}

	return queue.Run()
}

func NewValidation() (*Validation, error) {
	id, err := gonanoid.New()
	if err != nil {
		return nil, err
	}

	ctx := &Validation{
		id:           id,
		emitter:      internal.NewEmitter(id),
		documentMap:  map[string]types.Document{},
		documentColl: js.NewCollection(),
		scripts:      map[string]ScriptEnv{},
		results:      []*ValidationResult{},
	}

	go ctx.emitter.Start()

	return ctx, nil
}
