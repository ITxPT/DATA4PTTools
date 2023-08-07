package main

import (
	"context"
	"encoding/json"
	"path/filepath"
	"sync"
	"time"

	"github.com/concreteit/greenlight"
	petname "github.com/dustinkirkland/golang-petname"
	gonanoid "github.com/matoous/go-nanoid"
)

func init() {
	petname.NonDeterministicMode()
}

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
		Name:        petname.Generate(2, "-"),
		Created:     time.Now(),
		fileContext: NewFileContext(context.Background()),
		Status:      "created",
	}

	s.sessions[id] = session

	return session, nil
}

type Session struct {
	ID       string       `json:"id"`
	Name     string       `json:"name"`
	Created  time.Time    `json:"created"`
	Stopped  time.Time    `json:"stopped"`
	Status   string       `json:"status"`
	Profile  *Profile     `json:"profile"`
	XSDFiles []*XSDUpload `json:"xsdFiles"`
	Results  []*greenlight.ValidationResult

	fileContext *FileContext `json:"-"`
}

func (s *Session) NewValidation() (*greenlight.Validation, error) {
	validation, err := greenlight.NewValidation()
	if err != nil {
		return nil, err
	}

	s.Results = []*greenlight.ValidationResult{}
	xsdConfig := s.xsdConfig()

	for _, file := range s.fileContext.Find("xml") {
		if err := validation.AddFile(file.Name, file.FilePath); err != nil {
			return nil, err
		}

		file.File.Seek(0, 0)

		rvs := []*greenlight.RuleValidation{}
		for _, script := range s.Profile.Scripts {
			for name, s := range scripts {
				if name == script.Name {
					if name == "xsd" {
						validation.AddScript(s, xsdConfig)
					} else {
						validation.AddScript(s, script.Config)
					}

					rvs = append(rvs, &greenlight.RuleValidation{
						Name:       script.Name,
						Valid:      false,
						ErrorCount: 0,
						Errors:     []greenlight.TaskError{},
					})
				}
			}
		}

		s.Results = append(s.Results, &greenlight.ValidationResult{
			Name:            file.Name,
			Valid:           false,
			ValidationRules: rvs,
		})
	}

	return validation, nil
}

func (s *Session) xsdConfig() map[string]any {
	config := map[string]any{}
	for _, script := range s.Profile.Scripts {
		if script.Name == "xsd" {
			config = script.Config
			if schema, ok := script.Config["schema"].(string); ok && schema == "custom" && s.XSDFiles != nil {
				if entry, ok := script.Config["entry"].(string); ok {
					for _, xsdFile := range s.XSDFiles {
						if xsdFile.Files == nil {
							continue
						}
						for _, file := range xsdFile.Files {
							if file.ID != entry {
								continue
							}

							config = map[string]any{
								"schema": filepath.Join(xsdFile.dirPath, file.Name),
							}
						}
					}
				}
			}
			return config
		}
	}
	return config
}

func (s Session) MarshalJSON() ([]byte, error) {
	obj := map[string]interface{}{
		"id":       s.ID,
		"name":     s.Name,
		"created":  s.Created.Unix(),
		"files":    s.fileContext.Find("xml"),
		"status":   s.Status,
		"results":  s.Results,
		"profile":  s.Profile,
		"xsdFiles": s.XSDFiles,
	}

	if s.Status != "created" && s.Status != "running" {
		obj["stopped"] = s.Stopped.Unix()
	}

	return json.Marshal(obj)
}
