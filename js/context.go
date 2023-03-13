package js

import (
	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/xml"
)

type ContextOption = func(c *Context) error

type ContextHandler = func(c *Context) []interface{}

func WithMetaFields(fields map[string]interface{}) ContextOption {
	return func(c *Context) error {
		c.fields = fields
		return nil
	}
}

func WithEmitter(emitter *internal.Emitter) ContextOption {
	return func(c *Context) error {
		c.emitter = emitter
		return nil
	}
}

func WithConfig(cfg internal.M) ContextOption {
	return func(c *Context) error {
		c.Config = cfg
		return nil
	}
}

func WithNode(n xml.Node) ContextOption {
	return func(c *Context) error {
		c.Node = n
		return nil
	}
}

func WithDocument(doc *xml.Document) ContextOption {
	return func(c *Context) error {
		c.Xsd = Xsd{
			document: doc,
		}
		c.Document = doc
		return nil
	}
}

func WithCollection(coll *xml.Collection) ContextOption {
	return func(c *Context) error {
		c.Collection = coll
		return nil
	}
}

type Context struct {
	script  *Script
	emitter *internal.Emitter
	fields  map[string]interface{}

	// export to js runtime
	Config     internal.M
	Document   xml.Node
	Collection *xml.Collection
	Log        Logger
	Node       xml.Node
	Worker     *Worker
	Xsd        Xsd
}

func NewContext(script *Script, opts ...ContextOption) (*Context, error) {
	ctx := &Context{
		script: script,
	}
	ctx.Worker = NewWorker(ctx)
	ctx.Log = NewLogger(ctx)

	if opts != nil {
		for _, opt := range opts {
			if err := opt(ctx); err != nil {
				return nil, err
			}
		}
	}

	return ctx, nil
}

func (c *Context) log(fields map[string]interface{}) {
	if c.emitter == nil {
		return
	}

	if c.fields != nil {
		for k, v := range c.fields {
			fields[k] = v
		}
	}

	c.emitter.Emit(internal.EventTypeLog, fields)
}
