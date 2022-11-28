package js

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/concreteit/greenlight/internal"
	"github.com/lestrrat-go/libxml2/clib"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/lestrrat-go/libxml2/xpath"
	"github.com/lestrrat-go/libxml2/xsd"
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
	xsdSchemas = map[string]*xsd.Schema{}
)

var (
	ErrXSDSchemaNotFound    = fmt.Errorf("xsd schema not found")
	ErrXSDValidationInvalid = fmt.Errorf("invalid document")
)

type Xsd struct {
	document types.Document
}

func (x Xsd) Validate(version string) internal.Result {
	res := []ScriptError{}
	if err := ValidateSchema(x.document, version); err != nil {
		if sve, ok := err.(*ValidationError); ok {
			for _, d := range sve.Details() {
				line := 0
				if verr, ok := d.(clib.SchemaValidationError); ok {
					line = verr.Line
				}

				res = append(res, ScriptError{
					Type:    ErrTypeXSD.Error(),
					Message: d.Error(),
					Extra: internal.M{
						"line": int64(line),
					},
				})
			}

			return internal.NewResult(res, err)
		} else {
			return internal.NewResult(nil, err)
		}
	}

	return internal.NewResult(res, nil)
}

func newXPathContext(nodes ...types.Node) (*xpath.Context, error) {
	ctx, err := xpath.NewContext(nodes...)
	if err != nil {
		return nil, err
	}

	if err := ctx.RegisterNS("xsd", "http://www.w3.org/2001/XMLSchema"); err != nil {
		return nil, err
	}
	if err := ctx.RegisterNS("netex", "http://www.netex.org.uk/netex"); err != nil {
		return nil, err
	}

	return ctx, nil
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

func ValidateSchema(document types.Document, version string) error {
	xsdPath := xsdPaths[version]
	if xsdPath == "" {
		return NewValidationError(ErrXSDSchemaNotFound, nil)
	}
	if xsdSchemas[version] == nil {
		schema, err := xsd.ParseFromFile(xsdPath)
		if err != nil {
			return NewValidationError(err, nil)
		}

		xsdSchemas[version] = schema
	}

	_, errors := xsdSchemas[version].Validate(document)
	if errors != nil {
		return NewValidationError(ErrXSDValidationInvalid, errors)
	}

	return nil
}

func JoinXPath(values ...string) string {
	for i, v := range values {
		if xpathEleRe.MatchString(v) {
			values[i] = "netex:" + v
		}
	}
	return strings.Join(values, "/")
}
