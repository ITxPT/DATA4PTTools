package main

import (
	"context"
	"encoding/json"
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
	ID      string    `json:"id"`
	Created time.Time `json:"created"`
	Stopped time.Time `json:"stopped"`
	Status  string    `json:"status"`
	Profile *Profile  `json:"profile"`
	Results []greenlight.ValidationResult

	fileContext *FileContext `json:"-"`
}

func (s *Session) NewValidation() (*greenlight.Validation, error) {
	validation, err := greenlight.NewValidation()
	if err != nil {
		return nil, err
	}

	s.Results = []greenlight.ValidationResult{}

	for _, file := range s.fileContext.Find("xml") {
		if err := validation.AddFile(file.Name, file.FilePath); err != nil {
			return nil, err
		}

		file.File.Seek(0, 0)

		rvs := []*greenlight.RuleValidation{}

		for _, script := range s.Profile.Scripts {
			for name, s := range scripts {
				if name == script.Name {
					validation.AddScript(s, script.Config)

					rvs = append(rvs, &greenlight.RuleValidation{
						Name:       script.Name,
						Valid:      false,
						ErrorCount: 0,
						Errors:     []greenlight.TaskError{},
					})
				}
			}
		}

		s.Results = append(s.Results, greenlight.ValidationResult{
			Name:            file.Name,
			Valid:           false,
			ValidationRules: rvs,
		})
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
		"profile": s.Profile,
	}

	if s.Status != "created" && s.Status != "running" {
		obj["stopped"] = s.Stopped.Unix()
	}

	return json.Marshal(obj)
}
