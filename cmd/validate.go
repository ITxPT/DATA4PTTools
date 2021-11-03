package cmd

import (
  "os"
  "fmt"

  "github.com/spf13/cobra"
  "github.com/lestrrat-go/libxml2/xsd"
  "github.com/lestrrat-go/libxml2"
)

var (
  validateCmd = &cobra.Command{
    Use: "validate",
    Short: "Validate NeTEx files",
    Run: func(cmd *cobra.Command, args []string) {
      validate()
    },
  }
  input string
)

func init() {
  validateCmd.Flags().StringVarP(&input, "input", "i", "", "XML file to validate")
  rootCmd.AddCommand(validateCmd)
}

func validate() {
  schema, err := xsd.ParseFromFile("./xsd/NeTEx_publication.xsd")
  if err != nil {
    panic(err)
  }

  buf, err := os.ReadFile(input)
  if err != nil {
    panic(err)
  }

  doc, err := libxml2.Parse(buf)
  if err != nil {
    panic(err)
  }

  if err := schema.Validate(doc); err != nil {
    panic(err)
  }

  fmt.Println("OK")
}
