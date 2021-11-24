package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	rootCmd = &cobra.Command{
		Use:     "greenlight",
		Short:   "NeTEx/Siri validation tool",
		Version: "0.0.1",
		Run: func(cmd *cobra.Command, args []string) {
		},
	}
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
