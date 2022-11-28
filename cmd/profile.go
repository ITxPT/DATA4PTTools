package main

import (
	"encoding/json"
	"os"

	"github.com/concreteit/greenlight/internal"
)

type ValidationProfile struct {
	Name        string          `json:"name"`
	DisplayName string          `json:"displayName"`
	Version     string          `json:"version"`
	Scripts     []ProfileScript `json:"scripts"`
}

type ProfileScript struct {
	Name   string     `json:"name"`
	Config internal.M `json:"config"`
}

func OpenProfile(path string) (*ValidationProfile, error) {
	buf, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	v := &ValidationProfile{}
	return v, json.Unmarshal(buf, v)
}
