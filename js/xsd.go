package js

import (
	"fmt"
	"regexp"
	"sync"

	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/xml"
)

var (
	xpathEleRe = regexp.MustCompile("^(?i)[a-z]")
	xsdCache   = &XsdCache{
		data: map[string]*xml.Schema{},
	}
	internalXSDPaths = map[string]string{
		"epip@1.1.1":    "xsd/epip/1.1.1/NeTEx_publication_EPIP.xsd",
		"epip@1.1.1-nc": "xsd/epip/1.1.1/NeTEx_publication_EPIP-NoConstraint.xsd",
		"netex@1.2":     "xsd/netex/1.2/NeTEx_publication.xsd",
		"netex@1.2-nc":  "xsd/netex/1.2/NeTEx_publication-NoConstraint.xsd",
	}
)

var (
	ErrXSDSchemaNotFound    = fmt.Errorf("xsd schema not found")
	ErrXSDValidationInvalid = fmt.Errorf("invalid document")
)

type XsdCache struct {
	sync.RWMutex
	data map[string]*xml.Schema
}

func (c *XsdCache) Get(k string) *xml.Schema {
	return c.data[k]
}

func (c *XsdCache) Set(k string, v *xml.Schema) {
	c.data[k] = v
}

type Xsd struct {
	document *xml.Document
}

func (x Xsd) Parse(version string) internal.Result {
	return internal.NewResult(xml.NewDocument("xsd", internalXSDPaths[version]))
}

func (x Xsd) Validate(v string) internal.Result {
	scriptErrors := []ScriptError{}
	if res, err := ValidateSchema(x.document, resolveXSDPath(v)); err != nil {
		return internal.NewResult(nil, err)
	} else if !res.Valid {
		for _, verr := range res.Errors {
			scriptErrors = append(scriptErrors, ScriptError{
				Type:    ErrTypeXSD.Error(),
				Message: verr.Message,
				Extra: internal.M{
					"line": verr.Line,
				},
			})
		}
	}
	return internal.NewResult(scriptErrors, nil)
}

type ValidationError struct {
	err     error
	details []error
}

func (e ValidationError) Error() string { return e.err.Error() }

func (e ValidationError) Details() []error { return e.details }

func NewValidationError(err error, details []error) *ValidationError {
	return &ValidationError{
		err:     err,
		details: details,
	}
}

func resolveXSDPath(v string) string {
	if xsdPath := internalXSDPaths[v]; xsdPath != "" {
		return xsdPath
	} else {
		return v
	}
}

func ValidateSchema(doc *xml.Document, xsdPath string) (*xml.ValidationResult, error) {
	xsdCache.Lock()
	defer xsdCache.Unlock()
	var err error
	schema := xsdCache.Get(xsdPath)
	if schema == nil {
		schema, err = xml.NewSchema(xsdPath)
		if err != nil {
			return nil, err
		}
		xsdCache.Set(xsdPath, schema)
	}
	return schema.Validate(doc.FilePath)
}
