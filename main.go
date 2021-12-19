package greenlight

import (
	"path"
	"strings"

	"github.com/spf13/viper"
)

var (
	configPaths = []string{
		"$HOME/.greenlight",
		"/etc/greenlight",
		"/",
		"/greenlight",
		".",
	}
)

func stringsJoin(v string, o []string, joinHandler func(elem ...string) string) []string {
	res := []string{}

	for _, p := range o {
		res = append(res, joinHandler(p, v))
	}

	return res
}

func init() {
	// default `logger`properties
	viper.SetDefault("logger.level", "debug")

	// default `schema` properties
	viper.SetDefault("schema", "xsd/NeTEx_publication-NoConstraint.xsd")

	// default `scripts` properties
	viper.SetDefault("scripts.enableBuiltIn", true)
	viper.SetDefault("scripts.builtInPath", "./builtin")
	viper.SetDefault("scripts.paths", stringsJoin("scripts", configPaths, path.Join))

	// set paths to look for configuration file (first come, first serve)
	for _, p := range configPaths {
		viper.AddConfigPath(p)
	}

	// name of configuration file, supported formats are JSON, TOML, YAML, HCL, INI, envfile or Java properties file
	viper.SetConfigName("config")

	// if no configuration is found defaults will be used
	viper.ReadInConfig()

	// read properties from environment
	viper.SetEnvPrefix("GREENLIGHT")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()
}
