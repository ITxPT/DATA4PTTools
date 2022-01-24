package greenlight

import (
	"runtime"

	"github.com/concreteit/greenlight/logger"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xsd"
)

type task interface {
	Execute(id int) interface{}
}

func worker(id int, tasks <-chan task, results chan<- interface{}) {
	for task := range tasks {
		results <- task.Execute(id)
	}
}

func startWorkers(tasks <-chan task, results chan<- interface{}) {
	numWorkers := runtime.NumCPU()
	numTasks := cap(tasks)
	if numWorkers > numTasks {
		numWorkers = numTasks
	}

	for i := 1; i <= numWorkers; i++ {
		go worker(i, tasks, results)
	}
}

type taskValidateDocument struct {
	validator *Validator
	ctx       *ValidationContext
	name      string
	document  types.Document
}

func (t taskValidateDocument) Execute(id int) interface{} {
	return t.validator.ValidateDocument(t.name, t.document, t.ctx)
}

type taskScript struct {
	context  *ValidationContext
	script   *Script
	schema   *xsd.Schema
	logger   *logger.Logger
	name     string
	document types.Document
}

func (t taskScript) Execute(id int) interface{} {
	return t.script.Execute(t.context, t.schema, t.logger, t.name, t.document)
}
