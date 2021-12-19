package greenlight

import (
	"runtime"
)

type task interface {
	Execute(id int) interface{}
}

func worker(id int, tasks <-chan task, results chan<- interface{}) {
	for task := range tasks {
		results <- task.Execute(id)
	}
}

func startWorkers(tasks <-chan task, results chan<- interface{}) {
	numWorkers := runtime.NumCPU()
	numTasks := cap(tasks)
	if numWorkers > numTasks {
		numWorkers = numTasks
	}

	for i := 1; i <= numWorkers; i++ {
		go worker(i, tasks, results)
	}
}
