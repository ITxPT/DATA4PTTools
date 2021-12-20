package greenlight

import (
	"os"
	"strings"
)

func EnvPath(v string) string {
	vs := strings.Split(v, "/")

	for i, vp := range vs {
		if vp == "" {
			continue
		}
		if vp[0] == '$' {
			vs[i] = os.Getenv(vp[1:])
		}
	}

	return strings.Join(vs, "/")
}
