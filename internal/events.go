package internal

import (
	"sync"
	"time"
)

type EventType string

const (
	EventTypeLog             EventType = "LOG"
	EventTypeValidationStart EventType = "VALIDATION_START"
	EventTypeValidationStop  EventType = "VALIDATION_STOP"
	EventTypeScriptStart     EventType = "SCRIPT_START"
	EventTypeScriptStop      EventType = "SCRIPT_STOP"
	EventTypeWorkerStart     EventType = "WORKER_START"
	EventTypeWorkerStop      EventType = "WORKER_STOP"
)

type Event struct {
	ContextID string                 `json:"c"`
	Sequence  int                    `json:"s"`
	Type      EventType              `json:"t"`
	Timestamp time.Time              `json:"ts"`
	Data      map[string]interface{} `json:"d,omitempty"`
}

type EventHandler func(event Event)

type eventHandler struct {
	id      int
	handler EventHandler
}

type Emitter struct {
	sync.Mutex
	wg       sync.WaitGroup
	id       string
	queue    chan Event
	handlers []eventHandler
	inc      int
	seq      int
}

func (e *Emitter) Subscribe(handler EventHandler) int {
	e.Lock()
	defer e.Unlock()

	id := e.inc
	e.handlers = append(e.handlers, eventHandler{
		id:      id,
		handler: handler,
	})
	e.inc += 1

	return id
}

func (e *Emitter) Unsubscribe(id int) {
	e.Lock()
	defer e.Unlock()

	for i, h := range e.handlers {
		if h.id == id {
			e.handlers = append(e.handlers[:i], e.handlers[i+1:]...)
			return
		}
	}
}

func (e *Emitter) Emit(t EventType, data map[string]interface{}) Event {
	e.Lock()
	defer e.Unlock()

	event := Event{
		ContextID: e.id,
		Sequence:  e.seq,
		Type:      t,
		Timestamp: time.Now(),
		Data:      data,
	}
	e.wg.Add(1)
	e.queue <- event
	e.seq += 1

	return event
}

func (e *Emitter) Start() {
	for {
		event, ok := <-e.queue
		if !ok {
			return // channel closed
		}

		for _, h := range e.handlers {
			h.handler(event)
		}

		e.wg.Done()
	}
}

func (e *Emitter) Close() {
	close(e.queue)
	e.wg.Wait()
}

func NewEmitter(id string) *Emitter {
	return &Emitter{
		id:       id,
		queue:    make(chan Event),
		handlers: []eventHandler{},
		inc:      0,
		seq:      0,
	}
}
