package main

import (
	"github.com/concreteit/greenlight"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	serverCmd = &cobra.Command{
		Use:   "server",
		Short: "Start NeTEx validation server",
		Run:   server,
	}
)

func init() {
	serverCmd.Flags().StringP("port", "p", "8080", "Which port to listen http server on")
	serverCmd.Flags().StringP("mqtt-port", "", "1883", "Which port to listen mqtt server on")

	viper.BindPFlag("port", serverCmd.Flags().Lookup("port"))
	viper.BindPFlag("mqtt-port", serverCmd.Flags().Lookup("mqtt-port"))

	rootCmd.AddCommand(serverCmd)
}

func server(cmd *cobra.Command, args []string) {
	greenlight.StartServer(&greenlight.ServerConfig{
		Port:     viper.GetString("port"),
		MQTTPort: viper.GetString("mqtt-port"),
	})
}
