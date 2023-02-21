package js

import (
	"errors"
	"strings"
	"time"

	"github.com/concreteit/greenlight/internal"
	"github.com/concreteit/greenlight/xml"
)

var (
	ErrTypeGeneral     = errors.New("general")
	ErrTypeConsistency = errors.New("consistency")
	ErrTypeNotFound    = errors.New("not_found")
	ErrTypeQuality     = errors.New("quality")
	ErrTypeXSD         = errors.New("xsd")
)

func join(values ...string) string {
	return strings.Join(values, "/")
}

var (
	pathBase          = join(".")
	pathDataObjects   = join(pathBase, "dataObjects")
	pathFrameDefaults = join(pathDataObjects, "CompositeFrame", "FrameDefaults")
	pathFrames        = join(pathDataObjects, "CompositeFrame", "frames")
	std               = internal.M{
		"time": internal.M{
			"validLocation": func(name string) internal.Result {
				if _, err := time.LoadLocation(name); err != nil {
					return internal.NewResult(false, err)
				}

				return internal.NewResult(true, nil)
			},
		},
		"xpath": internal.M{
			"join": join,
			"path": internal.M{
				"BASE":           pathBase,
				"DATA_OBJECTS":   pathDataObjects,
				"FRAMES":         pathFrames,
				"FRAME_DEFAULTS": pathFrameDefaults,
			},
		},
		"errors": internal.M{
			"create": newScriptError,
			"ConsistencyError": func(msg string, extra internal.M) ScriptError {
				return newScriptError(ErrTypeConsistency.Error(), msg, extra)
			},
			"GeneralError": func(msg string, extra internal.M) ScriptError {
				return newScriptError(ErrTypeGeneral.Error(), msg, extra)
			},
			"NotFoundError": func(msg string, extra internal.M) ScriptError {
				return newScriptError(ErrTypeNotFound.Error(), msg, extra)
			},
			"QualityError": func(msg string, extra internal.M) ScriptError {
				return newScriptError(ErrTypeQuality.Error(), msg, extra)
			},
			"NODE_NOT_FOUND":   xml.ErrNodeNotFound.Error(),
			"SCHEMA_NOT_FOUND": ErrXSDSchemaNotFound.Error(),
			"TYPE_CONSISTENCY": ErrTypeConsistency.Error(),
			"TYPE_GENERAL":     ErrTypeGeneral.Error(),
			"TYPE_NOT_FOUND":   ErrTypeNotFound.Error(),
			"TYPE_QUALITY":     ErrTypeQuality.Error(),
			/* "XSD_VALIDATION_INVALID": ErrXSDValidationInvalid.Error(), */
		},
		"types": internal.M{},
	}
)

func Require(name string) interface{} { return std[name] }

type ScriptError struct {
	Type    string     `json:"type"`
	Message string     `json:"message"`
	Extra   internal.M `json:"extra"`
}

func newScriptError(t, msg string, extra internal.M) ScriptError {
	return ScriptError{
		Type:    t,
		Message: msg,
		Extra:   extra,
	}
}
