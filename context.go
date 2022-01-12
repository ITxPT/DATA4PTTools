package greenlight

import (
	"fmt"
	"io"
	"time"

	"github.com/lestrrat-go/libxml2"
	"github.com/lestrrat-go/libxml2/types"
	"github.com/schollz/progressbar/v3"
)

var (
	runningText = "Running tasks... "
	dance       = []string{"♪┏(･o･ )┛♪  ", "♪┗( ･o･)┓♪  "}
	angry       = []string{"( ಠДಠ) ┳━┳  ", "(┛ಠДಠ)┛彡┻━┻"}
)

type validationResult struct {
	Name string
}

type ValidationContext struct {
	*Measure

	name              string
	documents         map[string]types.Document
	results           []*ValidationResult
	enableProgressBar bool
	bar               *progressbar.ProgressBar
}

func (c *ValidationContext) Name() string { return c.name }

func (c *ValidationContext) Results() []*ValidationResult { return c.results }

func (c *ValidationContext) AddReader(name string, file io.Reader) error {
	document, err := libxml2.ParseReader(file)
	if err != nil {
		return err
	}

	c.documents[name] = document

	return nil
}

func (c *ValidationContext) AddDocument(name string, document types.Document) {
	c.documents[name] = document
}

func (c *ValidationContext) EnableProgressBar() {
	c.enableProgressBar = true
}

func (c *ValidationContext) startProgress(n int) {
	if !c.enableProgressBar {
		return
	}

	c.bar = progressbar.NewOptions(n,
		progressbar.OptionSetWidth(80),
		progressbar.OptionEnableColorCodes(true),
		progressbar.OptionSetPredictTime(false),
		progressbar.OptionShowCount(),
		progressbar.OptionSetDescription(runningText+dance[0]),
		progressbar.OptionSetItsString("tasks"),
		progressbar.OptionThrottle(time.Millisecond*250),
		progressbar.OptionSetTheme(progressbar.Theme{
			Saucer:        "[green]=[reset]",
			SaucerHead:    "[green]>[reset]",
			SaucerPadding: " ",
			BarStart:      "[",
			BarEnd:        "]",
		}),
	)

	fmt.Println("Validating documents and running scripts...")

	go func() {
		start := time.Now()
		tick := 0

		for !c.bar.IsFinished() {
			dur := time.Now().Sub(start)
			if tick == 1000 {
				tick = 0
			}
			if dur < time.Second*60 {
				c.bar.Describe(runningText + dance[tick%2])
			} else {
				c.bar.Describe(runningText + angry[tick%2])
			}

			tick = tick + 1
			time.Sleep(time.Second)
		}
	}()
}

func (c *ValidationContext) addProgress(n int) {
	if c.bar != nil {
		c.bar.Add(n)
	}

}

func NewValidationContext(name string) *ValidationContext {
	return &ValidationContext{
		Measure:   &Measure{},
		name:      name,
		documents: map[string]types.Document{},
		results:   []*ValidationResult{},
	}
}
