package greenlight

import (
	"fmt"
	"time"
)

const maxErrorCount = 1000

type ValidationResult struct {
	Name            string            `json:"name" xml:"name,attr"`
	Valid           bool              `json:"valid" xml:"valid,attr"`
	ValidationRules []*RuleValidation `json:"validations,omitempty" xml:"Validation,omitempty"`
}

func (r ValidationResult) CsvRecords(includeHeader bool) [][]string {
	res := [][]string{}
	header := []string{
		"file_name",
		"validation_name",
		"start",
		"stop",
		"valid",
		"error_line_no",
		"error_message",
	}

	if includeHeader {
		res = append(res, header)
	}

	for _, v := range r.ValidationRules {
		if v.Valid {
			res = append(res, []string{
				r.Name,
				v.Name,
				v.Start.Format(time.RFC3339),
				v.Stop.Format(time.RFC3339),
				"true",
				"",
				"",
			})
		} else {
			for _, err := range v.Errors {
				res = append(res, []string{
					r.Name,
					v.Name,
					v.Start.Format(time.RFC3339),
					v.Stop.Format(time.RFC3339),
					"false",
					fmt.Sprintf("%d", err.Line),
					err.Message,
				})
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
	Start       time.Time     `json:"-" xml:"-"`
	Stop        time.Time     `json:"-" xml:"-"`
	Duration    time.Duration `json:"-" xml:"-"`
	Name        string        `json:"name" xml:"name,attr"`
	Description string        `json:"description,omitempty" xml:"description,attr,omitempty"`
	Valid       bool          `json:"valid" xml:"valid,attr"`
	ErrorCount  int           `json:"error_count,omitempty" xml:"errorCount,attr,omitempty"`
	Errors      []TaskError   `json:"errors,omitempty" xml:"Errors,omitempty"`
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
		Name:  name,
		Valid: false,
	}
}
