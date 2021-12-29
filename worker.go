package greenlight

import (
	"fmt"
	"runtime"
	"time"
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

type taskValidateFile struct {
	validator *Validator
	filePath  string
}

func (t taskValidateFile) Execute(id int) interface{} {
	return t.validator.ValidateFile(t.filePath)
}

type Measure struct {
	start time.Time
	stop  time.Time

	ExecutionTimeMS int64 `json:"execution_time_ms"`
}

func (m *Measure) Start() { m.start = time.Now() }
func (m *Measure) Stop() {
	m.stop = time.Now()
	m.ExecutionTimeMS = m.stop.Sub(m.start).Milliseconds()
}

type FileValidationResult struct {
	*Measure

	FileName        string              `json:"file_name"`
	FileSize        int64               `json:"file_size"`
	Valid           bool                `json:"valid"`
	GeneralError    string              `json:"general_error,omitempty"`
	ValidationRules []*ValidationResult `json:"validation_rules,omitempty"`
}

type ValidationResult struct {
	*Measure

	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	Valid       bool     `json:"valid"`
	ErrorCount  int      `json:"error_count,omitempty"`
	Errors      []string `json:"errors,omitempty"`
}

func (v *ValidationResult) AddError(err error) {
	v.Valid = false
	v.ErrorCount++

	if v.ErrorCount <= 32 {
		v.Errors = append(v.Errors, err.Error())
	}
}

func generalValidationError(name string, err error) *FileValidationResult {
	return &FileValidationResult{
		FileName:     name,
		Valid:        false,
		GeneralError: fmt.Sprintf("%s", err),
	}
}
