package xml

/*
#cgo pkg-config: libxml-2.0
#include "./lxml.h"
*/
import "C"
import (
	"fmt"
)

var (
	ErrSchemaParse      = fmt.Errorf("error caught parsing schema")
	ErrSchemaValidation = fmt.Errorf("error caught validating document")
)

type Schema struct {
	ptr C.xmlSchemaPtr
}

func NewSchema(xsdPath string) (*Schema, error) {
	ptr := C.schemaParse(C.CString(xsdPath))
	if ptr == nil {
		return nil, ErrSchemaParse
	}

	return &Schema{
		ptr: ptr,
	}, nil
}

func (s *Schema) Validate(filePath string) (*ValidationResult, error) {
	cres := C.validateStream(s.ptr, C.CString(filePath))
	if cres == nil {
		return nil, ErrSchemaValidation
	}
	defer C.freeValidationResult(cres)

	if code := int(cres.errorCode); code < 0 {
		return nil, ErrSchemaValidation
	} else if code == 0 {
		return &ValidationResult{Valid: true}, nil
	}

	res := &ValidationResult{
		Valid:  false,
		Errors: []ValidationError{},
	}
	for i := 0; i < int(cres.errorCount); i++ {
		errMsg := cres.errors[i]
		res.Errors = append(res.Errors, ValidationError{
			Line:    int(errMsg.line),
			Level:   int(errMsg.level),
			Message: C.GoString(errMsg.message),
		})
	}

	return res, nil
}

func (s *Schema) Free() { C.xmlSchemaFree(s.ptr) }

type ValidationResult struct {
	Valid  bool
	Errors []ValidationError
}

type ValidationError struct {
	Line    int
	Level   int
	Message string
}
