package main

import (
	"encoding/json"
	"os"

	"github.com/concreteit/greenlight/internal"
)

type Profile struct {
	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	Version     string   `json:"version"`
	Scripts     []Script `json:"scripts"`
}

type Script struct {
	Name        string     `json:"name"`
	Description string     `json:"description,omitempty"`
	Version     string     `json:"string"`
	Config      internal.M `json:"config"`
}

func OpenProfile(path string) (*Profile, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	v := &Profile{}
	return v, json.NewDecoder(f).Decode(v)
}
