package js

import (
	"errors"
	"time"

	"github.com/concreteit/greenlight/internal"
)

var (
	ErrTypeGeneral     = errors.New("general")
	ErrTypeConsistency = errors.New("consistency")
	ErrTypeNotFound    = errors.New("not_found")
	ErrTypeQuality     = errors.New("quality")
	ErrTypeXSD         = errors.New("xsd")
)

var (
	pathBase          = JoinXPath(".", "PublicationDelivery")
	pathDataObjects   = JoinXPath(pathBase, "dataObjects")
	pathFrameDefaults = JoinXPath(pathDataObjects, "CompositeFrame", "FrameDefaults")
	pathFrames        = JoinXPath(pathDataObjects, "CompositeFrame", "frames")
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
			"join": JoinXPath,
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
			"NODE_NOT_FOUND":         ErrNodeNotFound.Error(),
			"SCHEMA_NOT_FOUND":       ErrXSDSchemaNotFound.Error(),
			"TYPE_CONSISTENCY":       ErrTypeConsistency.Error(),
			"TYPE_GENERAL":           ErrTypeGeneral.Error(),
			"TYPE_NOT_FOUND":         ErrTypeNotFound.Error(),
			"TYPE_QUALITY":           ErrTypeQuality.Error(),
			"XSD_VALIDATION_INVALID": ErrXSDValidationInvalid.Error(),
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
