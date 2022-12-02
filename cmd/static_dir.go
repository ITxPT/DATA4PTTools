package main

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"
)

type StaticDir struct {
	d http.Dir
}

func (d StaticDir) resolvePath(fullPath string, isDir bool) (string, error) {
	dir := path.Dir(fullPath)
	name := strings.Replace(fullPath, dir, "", 1)
	name = strings.ReplaceAll(name, "/", "")
	f, err := d.d.Open(dir)
	if err != nil {
		return "", err
	}

	fs, err := f.Stat()
	if err != nil {
		return "", err
	}

	if !fs.IsDir() {
		return "", fmt.Errorf("path is not dir")
	}

	files, err := f.Readdir(0)
	if err != nil {
		return "", err
	}

	// find a file with the matching name
	for _, file := range files {
		if file.Name() == name {
			return name, nil
		}
		if file.Name()[0] == '[' {
			if file.IsDir() == isDir {
				return file.Name(), nil
			}
		}
		if !isDir && !file.IsDir() {
			ext := path.Ext(file.Name())
			if name == strings.Replace(file.Name(), ext, "", 1) {
				return file.Name(), nil
			}
		}
	}

	return "", fmt.Errorf("file not found")
}

func (d StaticDir) open(name string) (http.File, error) {
	pathSlice := strings.Split(name, "/")
	n := len(pathSlice)
	for i, _ := range pathSlice {
		cp := strings.Join(pathSlice[:i+1], "/")
		if cp == "" {
			continue
		}

		p, err := d.resolvePath(cp, i+1 != n)
		if err != nil {
			return nil, err
		}

		pathSlice[i] = p
	}

	return d.d.Open(strings.Join(pathSlice, "/"))
}

func (d StaticDir) Open(name string) (http.File, error) {
	f, err := d.d.Open(name)
	if os.IsNotExist(err) {
		return d.open(name)
	}

	fs, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if fs.IsDir() {
		if f, err := d.d.Open(name + ".html"); err == nil {
			return f, nil
		}
	}

	return f, err
}
