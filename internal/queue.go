package internal

import (
	"runtime"

	"github.com/sourcegraph/conc/pool"
)

type Task func(int) Result

type Queue struct {
	tasks []Task
}

func (q *Queue) Add(task Task) {
	q.tasks = append(q.tasks, task)
}

func (q *Queue) Run() []Result {
	wg := pool.New().WithMaxGoroutines(runtime.GOMAXPROCS(0))
	res := []Result{}
	for i, t := range q.tasks {
		task := t
		id := i + 1
		wg.Go(func() {
			res = append(res, task(id))
		})
	}

	q.tasks = []Task{}
	wg.Wait()

	return res
}

func NewQueue() *Queue {
	return &Queue{
		tasks: []Task{},
	}
}
