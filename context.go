package greenlight

import (
	"io"
	"sort"
	"sync"
	"time"

	"github.com/lestrrat-go/libxml2"
	"github.com/lestrrat-go/libxml2/types"
)

type validationResult struct {
	Name string
}

type progress struct {
	count     int
	completed int
	status    string
	rows      map[string]string
	jobStatus map[string]string
}

func publishProgress(ctx *ValidationContext) {
	for !ctx.done {
		ctx.publishProgress()
		time.Sleep(time.Millisecond * 200)
	}
}

type ValidationContext struct {
	sync.Mutex
	*Measure

	name      string
	documents map[string]types.Document
	results   []*ValidationResult
	progress  map[string]*progress
	done      bool
}

func (c *ValidationContext) Name() string { return c.name }

func (c *ValidationContext) Results() []*ValidationResult { return c.results }

func (c *ValidationContext) AddReader(name string, file io.ReadSeeker) error {
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
	c.Lock()
	defer c.Unlock()
	n := len(scripts)
	filler := map[string]string{}
	jobStatus := map[string]string{}
	for _, name := range scripts.Keys() {
		filler[name] = "starting"
		jobStatus[name] = "running"
	}

	c.progress[name] = &progress{
		count:     n + 1,
		completed: 0,
		status:    "running",
		rows:      filler,
		jobStatus: jobStatus,
	}
}

func (c *ValidationContext) publishProgress() {
	progress := []map[string]interface{}{}
	for name, p := range c.progress {
		progress = append(progress, map[string]interface{}{
			"name":      name,
			"count":     p.count,
			"completed": p.completed,
			"rows":      p.rows,
			"status":    p.status,
			"jobStatus": p.jobStatus,
		})
	}
	publishMessage("progress/"+c.name, progress)
}

func (c *ValidationContext) incrProgressCount(name string) {
	c.Lock()
	defer c.Unlock()
	if p := c.progress[name]; p != nil {
		p.count += 1
	}
}

func (c *ValidationContext) incrProgressCompleted(name string) {
	c.Lock()
	defer c.Unlock()
	if p := c.progress[name]; p != nil {
		p.completed += 1
	}
}

func (c *ValidationContext) addProgress(name, scriptName, message string, n int, status string) {
	c.Lock()
	defer c.Unlock()

	p := c.progress[name]
	if p == nil {
		return
	}

	if scriptName != "" {
		p.rows[scriptName] = message
		p.jobStatus[scriptName] = status
	} else {
		p.status = status
	}

	p.completed += n
	names := []string{}
	w := 0
	for n, _ := range p.rows {
		if len(n) > w {
			w = len(n)
		}

		names = append(names, n)
	}

	sort.SliceStable(names, func(i, j int) bool { return names[i] < names[j] })
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
