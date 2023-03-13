package js

import (
	"fmt"
	"regexp"

	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/xml"
)

var (
	xpathEleRe = regexp.MustCompile("^(?i)[a-z]")
	xsdPaths   = map[string]string{
		"epip@1.1.1":    "xsd/epip/1.1.1/NeTEx_publication_EPIP.xsd",
		"epip@1.1.1-nc": "xsd/epip/1.1.1/NeTEx_publication_EPIP-NoConstraint.xsd",
		"netex@1.2":     "xsd/netex/1.2/NeTEx_publication.xsd",
		"netex@1.2-nc":  "xsd/netex/1.2/NeTEx_publication-NoConstraint.xsd",

		// TODO none of the versioned xsd schemas below compiles
		"netex@1.01":    "xsd/netex/1.01/NeTEx_publication.xsd",
		"netex@1.02":    "xsd/netex/1.02/NeTEx_publication.xsd",
		"netex@1.03":    "xsd/netex/1.03/NeTEx_publication.xsd",
		"netex@1.03-nc": "xsd/netex/1.03/NeTEx_publication-NoConstraint.xsd",
	}
	xsdSchemas = map[string]*xml.Schema{}
)

var (
	ErrXSDSchemaNotFound    = fmt.Errorf("xsd schema not found")
	ErrXSDValidationInvalid = fmt.Errorf("invalid document")
)

type Xsd struct {
	document *xml.Document
}

func (x Xsd) Validate(version string) internal.Result {
	scriptErrors := []ScriptError{}
	if res, err := ValidateSchema(x.document, version); err != nil {
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

func ValidateSchema(doc *xml.Document, version string) (*xml.ValidationResult, error) {
	xsdPath := xsdPaths[version]
	if xsdPath == "" {
		return nil, ErrXSDSchemaNotFound
	}
	if xsdSchemas[version] == nil {
		_, err := CompileSchemaVersion(version)
		if err != nil {
			return nil, err
		}
	}

	return xsdSchemas[version].Validate(doc.FilePath)
}

func CompileSchemaVersion(version string) (*xml.Schema, error) {
	xsdPath := xsdPaths[version]
	if xsdPath == "" {
		return nil, ErrXSDSchemaNotFound
	}

	schema, err := xml.NewSchema(xsdPath)
	if err != nil {
		return nil, err
	}

	xsdSchemas[version] = schema

	return schema, nil
}
