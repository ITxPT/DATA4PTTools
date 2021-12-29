package greenlight

import (
	"github.com/concreteit/greenlight/libxml2/types"
	"github.com/concreteit/greenlight/libxml2/xpath"
)

func netexContext(n ...types.Node) (*xpath.Context, error) {
	ctx, err := xpath.NewContext(n...)
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
