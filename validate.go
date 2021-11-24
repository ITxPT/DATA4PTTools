package greenlight

import (
	"fmt"
	"io"
	"os"
	"runtime"
	"time"

	"github.com/concreteit/greenlight/libxml2"
	"github.com/concreteit/greenlight/libxml2/xsd"
)

type FileValidationResult struct {
	FileName       string   `json:"file_name"`
	ValidationTime float64  `json:"validation_time"`
	Valid          bool     `json:"valid"`
	FileSize       int64    `json:"file_size"`
	ErrorCount     int      `json:"error_count,omitempty"`
	Errors         []string `json:"errors,omitempty"`
}

func worker(schema *xsd.Schema, jobs <-chan string, results chan<- *FileValidationResult) {
	for filePath := range jobs {
		results <- ValidateFile(schema, filePath)
	}
}

func genericValidationError(result *FileValidationResult, err error) *FileValidationResult {
	result.Valid = false
	result.ErrorCount = 1
	result.Errors = []string{fmt.Sprintf("%s", err)}
	return result
}

func ValidateReader(schema *xsd.Schema, reader io.Reader) *FileValidationResult {
	result := &FileValidationResult{
		Valid:  true,
		Errors: []string{},
	}
	start := time.Now()

	defer func() {
		result.ValidationTime = time.Since(start).Seconds()
	}()

	doc, err := libxml2.ParseReader(reader)
	if err != nil {
		return genericValidationError(result, err)
	}

	if n, errors := schema.Validate(doc); n > 0 {
		result.Valid = false
		result.ErrorCount = n

		for _, err := range errors {
			result.Errors = append(result.Errors, fmt.Sprintf("%s", err))
		}
	}

	return result
}

func ValidateFile(schema *xsd.Schema, filePath string) *FileValidationResult {
	result := &FileValidationResult{
		FileName: filePath,
		Valid:    true,
		Errors:   []string{},
	}
	start := time.Now()
	file, err := os.Open(filePath)
	if err != nil {
		return genericValidationError(result, err)
	}

	defer file.Close()
	defer func() {
		result.ValidationTime = time.Since(start).Seconds()

		if fi, err := file.Stat(); err == nil {
			result.FileSize = fi.Size()
		}
	}()

	doc, err := libxml2.ParseReader(file)
	if err != nil {
		return genericValidationError(result, err)
	}

	if n, errors := schema.Validate(doc); n > 0 {
		result.Valid = false
		result.ErrorCount = n

		for _, err := range errors {
			result.Errors = append(result.Errors, fmt.Sprintf("%s", err))
		}
	}

	return result
}

func ValidateFiles(schema *xsd.Schema, filePaths []string) []*FileValidationResult {
	results := []*FileValidationResult{}
	workers := runtime.NumCPU()
	numJobs := len(filePaths)
	if numJobs < workers {
		workers = numJobs
	}

	jobs := make(chan string, numJobs)
	res := make(chan *FileValidationResult, numJobs)

	for i := 0; i < workers; i++ {
		go worker(schema, jobs, res)
	}

	for _, filePath := range filePaths {
		jobs <- filePath
	}
	close(jobs)

	for i := 0; i < numJobs; i++ {
		results = append(results, <-res)
	}

	return results
}
