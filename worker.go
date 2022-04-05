package greenlight

import (
	"runtime"
	"time"
)

var (
	validatorPool *WorkerPool
	mainPool      *WorkerPool
	workerPool    *WorkerPool
)

type TaskHandler func(int)

type Task struct {
	created time.Time
	started time.Time
	stopped time.Time
	handler TaskHandler
}

type WorkerPool struct {
	concurrency int
	tasks       chan Task
}

func (p *WorkerPool) Run() {
	for i := 0; i < p.concurrency; i++ {
		go func(id int) {
			for task := range p.tasks {
				task.started = time.Now()
				task.handler(id)
				task.stopped = time.Now()
			}
		}(i + 1)
	}
}

func (p *WorkerPool) Add(handler TaskHandler) {
	p.tasks <- Task{
		created: time.Now(),
		handler: handler,
	}
}

func NewPool(concurrency int, buffer int) *WorkerPool {
	var queue chan Task
	if buffer > 0 {
		queue = make(chan Task, buffer)
	} else {
		queue = make(chan Task)
	}
	return &WorkerPool{
		concurrency: concurrency,
		tasks:       queue,
	}
}

func init() {
	validatorPool = NewPool(runtime.NumCPU(), 0)
	validatorPool.Run()
	mainPool = NewPool(runtime.NumCPU(), 0)
	mainPool.Run()
	workerPool = NewPool(runtime.NumCPU(), 0)
	workerPool.Run()
}
