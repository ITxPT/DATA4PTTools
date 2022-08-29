package js

import (
	"time"

	"github.com/concreteit/greenlight/internal"
)

var (
	pathBase        = JoinXPath(".", "PublicationDelivery")
	pathDataObjects = JoinXPath(pathBase, "dataObjects")
	pathFrames      = JoinXPath(pathDataObjects, "CompositeFrame", "frames")
	std             = internal.M{
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
				"BASE":         pathBase,
				"DATA_OBJECTS": pathDataObjects,
				"FRAMES":       pathFrames,
			},
		},
		"errors": internal.M{
			"NODE_NOT_FOUND":         ErrNodeNotFound.Error(),
			"SCHEMA_NOT_FOUND":       ErrXSDSchemaNotFound.Error(),
			"XSD_VALIDATION_INVALID": ErrXSDValidationInvalid.Error(),
		},
		"types": internal.M{},
	}
)

func Require(name string) interface{} { return std[name] }
