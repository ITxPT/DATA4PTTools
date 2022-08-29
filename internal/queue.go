package internal

import (
	"runtime"
	"sync"
)

type Task func(int) Result

type Queue struct {
	concurrency int
	tasks       chan Task
}

func (q *Queue) Add(task Task) {
	q.tasks <- task
}

func (q *Queue) Run() []Result {
	var wg sync.WaitGroup
	n := len(q.tasks)
	res := []Result{}

	wg.Add(n)

	for i := 0; i < q.concurrency; i++ {
		go func(id int) {
			for task := range q.tasks {
				res = append(res, task(id))
				wg.Done()
			}
		}(i + 1)
	}

	wg.Wait()

	return res
}

func NewQueue(n, size int) *Queue {
	var tasks chan Task
	if size > 0 {
		tasks = make(chan Task, size)
	} else {
		tasks = make(chan Task)
	}

	concurrency := n
	if n <= 0 {
		concurrency = runtime.NumCPU()
	}

	return &Queue{
		concurrency: concurrency,
		tasks:       tasks,
	}
}
