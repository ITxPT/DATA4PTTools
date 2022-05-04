package greenlight

import (
	"fmt"
	"net/http"
	"os"
	"path"
)

type StaticDir struct {
	d http.Dir
}

func (d StaticDir) genericPath(name string) (http.File, error) {
	dir := path.Dir(name)
	f, err := d.d.Open(dir)
	if err != nil {
		return nil, err
	}

	fs, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if fs.IsDir() {
		files, err := f.Readdir(0)
		if err != nil {
			return nil, err
		}

		for _, file := range files {
			if file.Name()[0] == '[' {
				return d.d.Open(dir + "/" + file.Name())
			}
		}
	}

	return nil, fmt.Errorf("file not found")
}

func (d StaticDir) Open(name string) (http.File, error) {
	f, err := d.d.Open(name)
	if os.IsNotExist(err) {
		return d.genericPath(name)
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
