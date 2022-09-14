package main

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/concreteit/greenlight"
	"github.com/matoous/go-nanoid"
)

type SessionMap struct {
	rw       sync.Mutex
	sessions map[string]*Session
}

func (s *SessionMap) Get(id string) *Session {
	s.rw.Lock()
	defer s.rw.Unlock()
	return s.sessions[id]
}

func (s *SessionMap) New() (*Session, error) {
	s.rw.Lock()
	defer s.rw.Unlock()

	id, err := gonanoid.Nanoid()
	if err != nil {
		return nil, err
	}

	session := &Session{
		ID:          id,
		Created:     time.Now(),
		fileContext: NewFileContext(context.Background()),
		Status:      "created",
	}

	s.sessions[id] = session

	return session, nil
}

type Session struct {
	ID          string       `json:"id"`
	Created     time.Time    `json:"created"`
	Stopped     time.Time    `json:"stopped"`
	fileContext *FileContext `json:"-"`
	Status      string       `json:"status"`
	Results     []greenlight.ValidationResult
}

func (s *Session) NewValidation(schema string, rules []string) (*greenlight.Validation, error) {
	validation, err := greenlight.NewValidation()
	if err != nil {
		return nil, err
	}

	s.Results = []greenlight.ValidationResult{}

	for _, file := range s.fileContext.Find("xml") {
		f, err := file.Open()
		if err != nil {
			return nil, err
		}

		if err := validation.AddReader(file.Name, f); err != nil {
			return nil, err
		}

		file.File.Seek(0, 0)

		rvs := []*greenlight.RuleValidation{{
			Name:       "xsd",
			Valid:      false,
			ErrorCount: 0,
			Errors:     []greenlight.TaskError{},
		}}

		if rules != nil {
			for _, rule := range rules {
				rvs = append(rvs, &greenlight.RuleValidation{
					Name:       rule,
					Valid:      false,
					ErrorCount: 0,
					Errors:     []greenlight.TaskError{},
				})
			}
		}

		s.Results = append(s.Results, greenlight.ValidationResult{
			Name:            file.Name,
			Valid:           false,
			ValidationRules: rvs,
		})
	}

	validation.AddScript(scripts["xsd"], map[string]interface{}{
		"schema": schema,
	})

	if rules != nil {
		for _, r := range rules {
			script := scripts[r]
			if script == nil {
				return nil, fmt.Errorf("script '%v' not found", r)
			}

			validation.AddScript(script, nil)
		}
	}

	return validation, nil
}

func (s Session) MarshalJSON() ([]byte, error) {
	obj := map[string]interface{}{
		"id":      s.ID,
		"created": s.Created.Unix(),
		"files":   s.fileContext.Find("xml"),
		"status":  s.Status,
		"results": s.Results,
	}

	if s.Status != "created" && s.Status != "running" {
		obj["stopped"] = s.Stopped.Unix()
	}

	return json.Marshal(obj)
}
