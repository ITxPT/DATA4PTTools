package main

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/h2non/filetype"
	gonanoid "github.com/matoous/go-nanoid/v2"
)

type XSDUploadFile struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type XSDUpload struct {
	dirPath string

	Name  string          `json:"name"`
	Files []XSDUploadFile `json:"files,omitempty"`
}

func NewXSDUpload(name string, r io.Reader) (*XSDUpload, error) {
	dirPath, err := os.MkdirTemp(os.TempDir(), "greenlight")
	if err != nil {
		return nil, err
	}

	filePath := filepath.Join(dirPath, name)
	f, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	if _, err := io.Copy(f, r); err != nil {
		return nil, err
	}

	if _, err := f.Seek(0, 0); err != nil {
		return nil, err
	}

	fileType, err := filetype.MatchReader(f)
	if err != nil {
		return nil, err
	}

	files := []XSDUploadFile{}
	switch fileType.Extension {
	case "xml":
		id, err := gonanoid.New()
		if err != nil {
			return nil, err
		}

		files = append(files, XSDUploadFile{
			ID:   id,
			Name: name,
		})
	case "zip":
		if files, err = unzip(filePath, dirPath); err != nil {
			return nil, err
		}
	}

	return &XSDUpload{
		dirPath: dirPath,
		Name:    name,
		Files:   files,
	}, nil
}

func unzip(src, dst string) ([]XSDUploadFile, error) {
	r, err := zip.OpenReader(src)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	files := []XSDUploadFile{}
	for _, f := range r.File {
		rc, err := f.Open()
		if err != nil {
			return nil, err
		}

		filePath := filepath.Join(dst, f.Name)
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(filePath, f.Mode()); err != nil {
				return nil, err
			}
			continue
		}

		df, err := os.Create(filePath)
		if err != nil {
			continue
		}
		defer df.Close()

		if _, err := io.Copy(df, rc); err != nil {
			return nil, err
		}

		id, err := gonanoid.New()
		if err != nil {
			return nil, err
		}
		files = append(files, XSDUploadFile{
			ID:   id,
			Name: strings.TrimPrefix(filePath, dst+"/"),
		})
	}

	return files, nil
}
