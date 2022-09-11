package greenlight

import (
	"context"
	"fmt"
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

func (v *Validation) Validate(ctx context.Context) ([]ValidationResult, error) {
	emitData := internal.M{
		"documentCount": len(v.documentMap),
		"scriptCount":   len(v.scripts),
	}
	v.Emit(internal.EventTypeValidationStart, emitData)
	defer v.documentColl.Free()
	defer v.emitter.Close()
	defer v.Emit(internal.EventTypeValidationStop, emitData)

	n := len(v.documentMap)
	queue := internal.NewQueue(0, n)
	for name, doc := range v.documentMap {
		queue.Add(func(name string, doc types.Document) internal.Task {
			return func(id int) internal.Result {
				emitData := internal.M{
					"document":    name,
					"scriptCount": len(v.scripts),
				}
				v.Emit(internal.EventTypeValidateDocumentStart, emitData)
				defer v.Emit(internal.EventTypeValidateDocumentStop, emitData)

				res := ValidationResult{
					Name:            name,
					Valid:           true,
					ValidationRules: []*RuleValidation{},
				}
				or := v.validateDocument(name, doc)
				for _, r := range or {
					if r.IsErr() {
						return internal.NewResult(nil, r.Message())
					}
					if v, ok := r.Get().(*RuleValidation); !ok {
						return internal.NewResult(nil, fmt.Errorf("expected '%+v' to be of type '*RuleValidation'", r.Get()))
					} else {
						res.ValidationRules = append(res.ValidationRules, v)

						if !v.Valid {
							res.Valid = false
						}
					}
				}

				return internal.NewResult(res, nil)
			}
		}(name, doc))
	}

	res := []ValidationResult{}
	for _, r := range queue.Run() {
		if r.IsErr() {
			return nil, r.Message()
		}
		if vr, ok := r.Get().(ValidationResult); !ok {
			return nil, fmt.Errorf("expected '%+v' to be of type 'ValidationResult'", r.Get())
		} else {
			res = append(res, vr)
		}
	}

	return res, nil
}

func (v *Validation) validateDocument(name string, doc types.Document) []internal.Result {
	n := len(v.scripts)
	queue := internal.NewQueue(0, n)
	for _, script := range v.scripts {
		queue.Add(func(env ScriptEnv) internal.Task {
			return func(id int) internal.Result {
				res := env.script.Run(name, doc, v.emitter, v.documentColl, env.cfg)
				if res.IsErr() {
					return res
				}
				if res.Get() == nil {
				}
				sr, ok := res.Get().(js.ScriptResult)
				if !ok {
				}

				rv := &RuleValidation{
					Name:   env.script.Name(),
					Valid:  true,
					Errors: []TaskError{},
				}

				if sr.Errors != nil {
					for _, err := range sr.Errors {
						te := TaskError{
							Message: err.Message,
							Type:    err.Type,
						}

						if err.Extra != nil && err.Extra["line"] != nil {
							te.Line = int(err.Extra["line"].(int64))
						}

						rv.AddError(te)
					}
				}

				return internal.NewResult(rv, nil)
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
