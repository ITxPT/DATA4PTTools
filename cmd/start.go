package cmd

import (
  "github.com/spf13/cobra"
)

var (
  startCmd = &cobra.Command{
    Use: "start",
    Short: "Start validation server",
    Run: func(cmd *cobra.Command, args []string) {
    },
  }
)

func init() {
  rootCmd.AddCommand(startCmd)
}
