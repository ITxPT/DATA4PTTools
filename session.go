package greenlight

import (
	"context"
	"encoding/json"
	"sync"
	"time"

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
	Results     []*ValidationResult
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
