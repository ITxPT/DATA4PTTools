package greenlight

import (
	"fmt"
	"time"
)

const maxErrorCount = 1000

type Measure struct {
	start         time.Time
	stop          time.Time
	executionTime time.Duration
}

func (m *Measure) Start() { m.start = time.Now() }
func (m *Measure) Stop() {
	m.stop = time.Now()
	m.executionTime = m.stop.Sub(m.start)
}

func (m *Measure) ExecutionTime() time.Duration { return m.executionTime }

type ValidationResult struct {
	*Measure

	Name            string            `json:"name" xml:"name,attr"`
	Valid           bool              `json:"valid" xml:"valid,attr"`
	GeneralError    string            `json:"general_error,omitempty" xml:"GeneralError,omitempty"`
	ValidationRules []*RuleValidation `json:"validations,omitempty" xml:"Validation,omitempty"`
}

func (r ValidationResult) CsvRecords(includeHeader bool) [][]string {
	res := [][]string{}
	header := []string{"file_name", "validation_name", "valid", "error_line_no", "error_message"}

	if includeHeader {
		res = append(res, header)
	}

	for _, v := range r.ValidationRules {
		if v.Valid {
			res = append(res, []string{r.Name, v.Name, "true", "", ""})
		} else {
			for _, err := range v.Errors {
				res = append(res, []string{r.Name, v.Name, "false", fmt.Sprintf("%d", err.Line), err.Message})
			}
		}
	}

	return res
}

type TaskError struct {
	Message string `json:"message"`
	Line    int    `json:"line,omitempty"`
	Type    string `json:"type,omitempty"`
}

type RuleValidation struct {
	*Measure

	Name        string      `json:"name" xml:"name,attr"`
	Description string      `json:"description,omitempty" xml:"description,attr,omitempty"`
	Valid       bool        `json:"valid" xml:"valid,attr"`
	ErrorCount  int         `json:"error_count,omitempty" xml:"errorCount,attr,omitempty"`
	Errors      []TaskError `json:"errors,omitempty" xml:"Errors,omitempty"`
}

func (v *RuleValidation) AddError(err TaskError) {
	v.Valid = false

	if v.ErrorCount < maxErrorCount {
		v.ErrorCount++
		v.Errors = append(v.Errors, err)
	}
}

func generalValidationError(name string, err error) *ValidationResult {
	return &ValidationResult{
		Name:         name,
		Valid:        false,
		GeneralError: fmt.Sprintf("%s", err),
	}
}
