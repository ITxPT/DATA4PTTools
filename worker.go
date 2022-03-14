package greenlight

import (
	"runtime"
)

var (
	validatorPool *WorkerPool
	scriptPool    *WorkerPool
	workerPool    *WorkerPool
)

type WorkerPool struct {
	maxWorkers int
	tasks      chan func(int)
}

func (p *WorkerPool) Run() {
	for i := 0; i < p.maxWorkers; i++ {
		go func(id int) {
			for task := range p.tasks {
				task(id)
			}
		}(i + 1)
	}
}

func (p *WorkerPool) Add(task func(int)) {
	p.tasks <- task
}

func NewPool(max int) *WorkerPool {
	return &WorkerPool{
		maxWorkers: max,
		tasks:      make(chan func(int)),
	}
}

func init() {
	validatorPool = NewPool(runtime.NumCPU())
	validatorPool.Run()
	scriptPool = NewPool(runtime.NumCPU())
	scriptPool.Run()
	workerPool = NewPool(runtime.NumCPU())
	workerPool.Run()
}
