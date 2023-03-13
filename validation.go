package greenlight

import (
	"context"
	"fmt"
	"time"

	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/js"
	"github.com/concreteit/greenlight/xml"
	"github.com/matoous/go-nanoid/v2"
)

type ScriptEnv struct {
	script *js.Script
	cfg    map[string]interface{}
}

type Validation struct {
	id           string
	emitter      *internal.Emitter
	documentMap  map[string]*xml.Document
	documentColl *xml.Collection
	scripts      map[string]ScriptEnv
}

func (v *Validation) Emit(t internal.EventType, data map[string]interface{}) {
	v.emitter.Emit(t, data)
}

func (v *Validation) Subscribe(handler internal.EventHandler) int {
	return v.emitter.Subscribe(handler)
}

func (v *Validation) Unsubscribe(id int) {
	v.emitter.Unsubscribe(id)
}

func (v *Validation) AddDocument(doc *xml.Document) error {
	v.documentMap[doc.Name] = doc
	v.documentColl.Add(doc)

	return nil
}

func (v *Validation) AddFile(name, filePath string) error {
	doc, err := xml.NewDocument(name, filePath)
	if err != nil {
		return err
	}

	return v.AddDocument(doc)
}

func (v *Validation) AddScript(script *js.Script, cfg map[string]interface{}) {
	v.scripts[script.Name()] = ScriptEnv{
		script: script,
		cfg:    cfg,
	}
}

func (v *Validation) Validate(ctx context.Context) ([]*ValidationResult, error) {
	emitData := internal.M{
		"documentCount": len(v.documentMap),
		"scriptCount":   len(v.scripts),
	}
	v.Emit(internal.EventTypeValidationStart, emitData)
	defer v.emitter.Close()
	defer v.Emit(internal.EventTypeValidationStop, emitData)

	n := len(v.documentMap)
	queue := internal.NewQueue(0, n)
	for name, doc := range v.documentMap {
		queue.Add(func(name string, doc *xml.Document) internal.Task {
			return func(id int) internal.Result {
				defer doc.Close()
				emitData := internal.M{
					"document":    name,
					"scriptCount": len(v.scripts),
				}
				v.Emit(internal.EventTypeValidateDocumentStart, emitData)
				defer v.Emit(internal.EventTypeValidateDocumentStop, emitData)

				res := &ValidationResult{
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

	res := []*ValidationResult{}
	for _, r := range queue.Run() {
		if r.IsErr() {
			return nil, r.Message()
		}
		if vr, ok := r.Get().(*ValidationResult); !ok {
			return nil, fmt.Errorf("expected '%+v' to be of type 'ValidationResult'", r.Get())
		} else {
			res = append(res, vr)
		}
	}

	return res, nil
}

func (v *Validation) validateDocument(name string, doc *xml.Document) []internal.Result {
	n := len(v.scripts)
	queue := internal.NewQueue(0, n)
	for _, script := range v.scripts {
		queue.Add(func(env ScriptEnv) internal.Task {
			return func(id int) internal.Result {
				rv := &RuleValidation{
					Start:  time.Now(),
					Name:   env.script.Name(),
					Valid:  true,
					Errors: []TaskError{},
				}
				res := env.script.Run(name, doc, v.emitter, v.documentColl, env.cfg)
				if res.IsErr() {
					return res
				}
				if res.Get() == nil {
					return internal.NewResult(nil, fmt.Errorf("invalid response from task"))
				}
				sr, ok := res.Get().(js.ScriptResult)
				if !ok {
					return internal.NewResult(nil, fmt.Errorf("invalid response from task"))
				}

				if sr.Errors != nil {
					for _, err := range sr.Errors {
						te := TaskError{
							Message: err.Message,
							Type:    err.Type,
						}

						if err.Extra != nil && err.Extra["line"] != nil {
							te.Line = mustInt(err.Extra["line"])
						}

						rv.AddError(te)
					}
				}

				rv.Stop = time.Now()
				rv.Duration = rv.Stop.Sub(rv.Start)

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
		documentMap:  map[string]*xml.Document{},
		documentColl: xml.NewCollection(),
		scripts:      map[string]ScriptEnv{},
	}

	go ctx.emitter.Start()

	return ctx, nil
}

func mustInt(v interface{}) int {
	i := 0
	switch t := v.(type) {
	case int:
		i = t
	case int8:
	case int16:
	case int32:
	case int64:
		i = int(t)
	}

	return i
}
