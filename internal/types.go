package internal

type M map[string]interface{}

type ValueHandler func(v interface{}) interface{}
type ErrorHandler func(err error) interface{}

type Result struct {
	value interface{}
	err   error
}

func (r Result) Message() error { return r.err }

func (r Result) IsErr() bool { return r.err != nil }

func (r Result) Get() interface{} { return r.value }

func (r Result) GetOrElse(op ErrorHandler) interface{} {
	if r.err != nil {
		return op(r.err)
	}

	return r.value
}

func (r Result) Map(op ValueHandler) Result {
	if r.err == nil {
		r.value = op(r.value)
	}

	return r
}

func NewResult(v interface{}, err error) Result {
	return Result{
		value: v,
		err:   err,
	}
}
