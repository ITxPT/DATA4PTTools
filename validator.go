package greenlight

import (
	"fmt"
	"os"
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
	schemaSize  int64
	useBuiltIn  bool
	logger      *logger.Logger
	scriptPaths []string
	scripts     ScriptMap
}

func (v *Validator) Schema() *xsd.Schema { return v.schema }
func (v *Validator) SchemaSize() int64   { return v.schemaSize }

func (v *Validator) Validate(ctx *ValidationContext) {
	defer func() {
		ctx.Stop()
	}()

	ctx.Start()

	numTasks := len(ctx.documents)
	res := make(chan interface{}, numTasks)

	for name, document := range ctx.documents {
		ctx.startProgress(name, v.scripts)

		validatorPool.Add(func(name string, doc types.Document) func(int) {
			return func(id int) {
				res <- v.ValidateDocument(name, doc, ctx)
			}
		}(name, document))
	}

	for i := 0; i < numTasks; i++ {
		if vr, ok := (<-res).(*ValidationResult); ok {
			ctx.results = append(ctx.results, vr)
			ctx.addProgress(vr.Name, "", "", 1)
		}
	}

	sort.SliceStable(ctx.results, func(i, j int) bool { return ctx.results[i].Name < ctx.results[j].Name })
}

func (v *Validator) ValidateDocument(name string, doc types.Document, ctx *ValidationContext) *ValidationResult {
	result := &ValidationResult{
		Measure:         &Measure{},
		Name:            name,
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
	res := make(chan interface{}, numTasks)

	docMax := 0
	for k, _ := range ctx.documents {
		if len(k) > docMax {
			docMax = len(k)
		}
	}

	for _, script := range v.scripts {
		l := v.logger.Copy()
		l.AddTag(logger.NewTag("name", "main", logger.WithTagWidth(10)))
		l.AddTag(logger.NewTag("script", script.name, logger.WithTagMaxWidth(v.scripts.Keys())))
		l.AddTag(logger.NewTag("document", name, logger.WithTagWidth(docMax)))

		mainPool.Add(func(script *Script) func(int) {
			return func(id int) {
				res <- script.Execute(ctx, v.schema, l, name, doc)
			}
		}(script))
	}

	for i := 0; i < numTasks; i++ {
		if vr, ok := (<-res).(*RuleValidation); ok {
			message := fmt.Sprintf("\033[32mok\033[0m")
			if !vr.Valid {
				message = fmt.Sprintf("\033[31mfailed\033[0m with %d errors and 0 warnings", vr.ErrorCount)
			}

			result.ValidationRules = append(result.ValidationRules, vr)
			ctx.addProgress(name, vr.Name, message, 1)
		}
	}

	return result
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

func WithSchemaFile(filePath string) ValidatorOption {
	return func(v *Validator) error {
		if fi, err := os.Stat(filePath); err != nil {
			return err
		} else {
			v.schemaSize = fi.Size()
		}
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
