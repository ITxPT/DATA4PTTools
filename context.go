package greenlight

import (
	"fmt"
	"io"
	"sort"
	"strings"

	"github.com/concreteit/greenlight/logger"
	"github.com/lestrrat-go/libxml2"
	"github.com/lestrrat-go/libxml2/types"
)

type validationResult struct {
	Name string
}

type progress struct {
	count     int
	completed int
	rows      map[string]string
}

type ValidationContext struct {
	*Measure

	name      string
	documents map[string]types.Document
	results   []*ValidationResult
	progress  map[string]*progress
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

func (c *ValidationContext) startProgress(name string, scripts ScriptMap) {
	n := len(scripts)
	filler := map[string]string{}
	for _, name := range scripts.Keys() {
		filler[name] = "starting"
	}

	c.progress[name] = &progress{n + 1, 0, filler}
	logger.DefaultTerminalOutput().AddBuffer(name, n+2)
}

func (c *ValidationContext) addProgress(name, scriptName, message string, n int) {
	p := c.progress[name]
	if p == nil {
		return
	}

	if scriptName != "" {
		p.rows[scriptName] = message
	}

	p.completed += n
	parts := 1
	if p.completed > 0 {
		pct := float64(p.completed) / float64(p.count)
		parts = int(10.0 * pct)
	}

	header := fmt.Sprintf("┌ \033[1m%s\033[0m ─╼", name)
	progress := fmt.Sprintf("└── [%d/%d] r̵̲unning tasks %s%s ─╼ ", p.completed, p.count, strings.Repeat("■", parts), strings.Repeat("□", 10-parts))
	if p.completed == p.count {
		progress = fmt.Sprintf("└───╼ ")
	}

	terminal := logger.DefaultTerminalOutput()
	terminal.LogTo(name, logger.NewLogEntry(logger.LogLevelInfo, nil, header))

	names := []string{}
	w := 0
	for n, _ := range p.rows {
		if len(n) > w {
			w = len(n)
		}

		names = append(names, n)
	}

	sort.SliceStable(names, func(i, j int) bool { return names[i] < names[j] })

	for _, scriptName := range names {
		message := p.rows[scriptName]
		log := fmt.Sprintf("│ \033[36m%s\033[0m ... %s%s", scriptName, strings.Repeat(" ", w-len(scriptName)), message)
		terminal.LogTo(name, logger.NewLogEntry(logger.LogLevelInfo, nil, log))
	}

	terminal.LogTo(name, logger.NewLogEntry(logger.LogLevelInfo, nil, progress))
}

func NewValidationContext(name string) *ValidationContext {
	return &ValidationContext{
		Measure:   &Measure{},
		name:      name,
		documents: map[string]types.Document{},
		results:   []*ValidationResult{},
		progress:  map[string]*progress{},
	}
}
