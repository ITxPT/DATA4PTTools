package greenlight

import (
	"sort"

	"github.com/concreteit/greenlight/logger"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xsd"
)

const (
	builtInPath = "./builtin"
)

type ValidatorOption func(*Validator) error

type Validator struct {
	schema      *xsd.Schema
	useBuiltIn  bool
	logger      *logger.Logger
	scriptPaths []string
	scripts     ScriptMap
}

func (v *Validator) Schema() *xsd.Schema {
	return v.schema
}

func NewValidator(options ...ValidatorOption) (*Validator, error) {
	var err error
	v := &Validator{
		useBuiltIn:  true,
		scriptPaths: []string{},
		scripts:     map[string]*Script{},
		logger:      logger.New(),
	}

	for _, option := range options {
		if err := option(v); err != nil {
			return nil, err
		}
	}

	scriptPaths := []string{}
	if v.useBuiltIn {
		scriptPaths = append(scriptPaths, builtInPath)
	}

	scriptPaths = append(scriptPaths, v.scriptPaths...)

	if v.scripts, err = CompilePath(scriptPaths...); err != nil {
		return nil, err
	}

	return v, nil
}

func (v *Validator) Validate(ctx *ValidationContext) {
	defer func() {
		ctx.Stop()
	}()

	ctx.Start()

	numTasks := len(ctx.documents)
	tasks := make(chan task, numTasks)
	res := make(chan interface{}, numTasks)

	startWorkers(tasks, res)

	for _, document := range ctx.documents {
		tasks <- taskValidateDocument{
			validator: v,
			ctx:       ctx,
			document:  document,
		}
	}

	close(tasks)

	for i := 0; i < numTasks; i++ {
		if vr, ok := (<-res).(*ValidationResult); ok {
			ctx.results = append(ctx.results, vr)
		}
	}

	sort.SliceStable(ctx.results, func(i, j int) bool { return ctx.results[i].Name < ctx.results[j].Name })
}

func (v *Validator) ValidateDocument(doc types.Document, ctx *ValidationContext) *ValidationResult {
	result := &ValidationResult{
		Measure:         &Measure{},
		Name:            ctx.Name(),
		Valid:           true,
		ValidationRules: []*RuleValidation{},
	}

	defer func() {
		for _, rule := range result.ValidationRules {
			if !rule.Valid {
				result.Valid = false
				break
			}
		}

		result.Stop()
	}()

	result.Start()

	numTasks := len(v.scripts)
	tasks := make(chan task, numTasks)
	res := make(chan interface{}, numTasks)

	startWorkers(tasks, res)

	for _, script := range v.scripts {
		l := v.logger.Copy()
		l.AddTag(logger.NewTag("name", "main", logger.WithTagWidth(10)))
		l.AddTag(logger.NewTag("script", script.name, logger.WithTagMaxWidth(v.scripts.Keys())))
		l.AddTag(logger.NewTag("document", ctx.Name()))

		tasks <- taskScript{
			script:    script,
			schema:    v.schema,
			logger:    l,
			document:  doc,
			documents: ctx.documents,
		}
	}

	close(tasks)

	for i := 0; i < numTasks; i++ {
		if vres, ok := (<-res).(*RuleValidation); ok {
			result.ValidationRules = append(result.ValidationRules, vres)
		}
	}

	return result
}

func WithSchemaFile(filePath string) ValidatorOption {
	return func(v *Validator) error {
		if schema, err := xsd.ParseFromFile(filePath); err != nil {
			return err
		} else {
			v.schema = schema
		}

		return nil
	}
}

func WithBuiltinScripts(enabled bool) ValidatorOption {
	return func(v *Validator) error {
		v.useBuiltIn = enabled
		return nil
	}
}

func WithLogger(logger *logger.Logger) ValidatorOption {
	return func(v *Validator) error {
		v.logger = logger
		return nil
	}
}

func WithScriptingPaths(paths []string) ValidatorOption {
	return func(v *Validator) error {
		v.scriptPaths = append(v.scriptPaths, paths...)
		return nil
	}
}
