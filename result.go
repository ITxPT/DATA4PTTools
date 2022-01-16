package greenlight

import (
	"fmt"
	"strings"
	"time"
)

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

	Name            string            `json:"file_name" xml:"name,attr"`
	Valid           bool              `json:"valid" xml:"valid,attr"`
	GeneralError    string            `json:"general_error,omitempty" xml:"GeneralError,omitempty"`
	ValidationRules []*RuleValidation `json:"validations,omitempty" xml:"Validation,omitempty"`
}

func (r *ValidationResult) Markdown(extended bool) string {
	valid := "✅"
	if !r.Valid {
		valid = "❌"
	}

	errorCount := 0
	warningCount := 0

	result := []string{}
	for _, v := range r.ValidationRules {
		if v.ErrorCount > 0 {
			result = append(result, v.Markdown())
			errorCount = errorCount + v.ErrorCount
		}
	}

	rows := []string{
		fmt.Sprintf("```\n%s\n```", r.Name),
		fmt.Sprintf("- **valid**    -> %s", valid),
		fmt.Sprintf("- **errors**   -> %d", errorCount),
		fmt.Sprintf("- **warnings** -> %d\n", warningCount),
	}

	if extended && len(result) > 0 {
		rows = append(rows, []string{
			"\n*only rules w/ errors or warnings are shown below*\n",
			"\n| Rule | Errors | Warnings |",
			"| ---- | ------ | -------- |",
		}...)
		rows = append(rows, result...)
	}

	rows = append(rows, "*---*")

	return strings.Join(rows, "\n")
}

type RuleValidation struct {
	*Measure

	Name        string   `json:"name" xml:"name,attr"`
	Description string   `json:"description,omitempty" xml:"description,attr,omitempty"`
	Valid       bool     `json:"valid" xml:"valid,attr"`
	ErrorCount  int      `json:"error_count,omitempty" xml:"errorCount,attr,omitempty"`
	Errors      []string `json:"errors,omitempty" xml:"Errors,omitempty"`
}

func (r *RuleValidation) Markdown() string {
	return fmt.Sprintf("| %s | %d | %d |", r.Name, r.ErrorCount, 0)
}

func (v *RuleValidation) AddError(err error) {
	v.Valid = false
	v.ErrorCount++

	if v.ErrorCount <= 32 {
		v.Errors = append(v.Errors, err.Error())
	}
}

func generalValidationError(name string, err error) *ValidationResult {
	return &ValidationResult{
		Name:         name,
		Valid:        false,
		GeneralError: fmt.Sprintf("%s", err),
	}
}
