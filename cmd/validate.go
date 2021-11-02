package cmd

import (
  "github.com/spf13/cobra"
)

var (
  validate = &cobra.Command{
    Use: "validate",
    Short: "Validate NeTEx files",
    Run: func(cmd *cobra.Command, args []string) {
    },
  }
)

func init() {
  rootCmd.AddCommand(validate)
}
