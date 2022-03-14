package greenlight

import (
	"archive/tar"
	"archive/zip"
	"compress/bzip2"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/h2non/filetype"
	"github.com/h2non/filetype/types"
)

type processFileHandler func(*FileInfo) error

type FileInfo struct {
	Name     string
	Checksum string
	File     *os.File
	FilePath string
	FileType types.Type
}

func (fi FileInfo) Open() (*os.File, error) {
	return os.Open(fi.FilePath)
}

func (fi FileInfo) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"name":     fi.Name,
		"checksum": fi.Checksum,
		"mimeType": fi.FileType.MIME.Value,
		"ext":      fi.FileType.Extension,
	})
}

// TODO add support for different storage solutions; s3, gs, mem
type FileContext struct {
	context.Context

	files []*FileInfo
}

func (c *FileContext) processFile(fi *FileInfo, handler processFileHandler) error {
	for {
		select {
		case <-c.Context.Done():
			return fmt.Errorf("context was cancelled")
		default:
			return handler(fi)
		}
	}
}

func (c *FileContext) Open(name string, r io.Reader) error {
	fi, err := c.Add(name, r)
	if err != nil {
		return err
	}

	switch fi.FileType.Extension {
	case "zip":
		return c.processFile(fi, c.unzip)
	case "gz":
		return c.processFile(fi, c.gunzip)
	case "tar":
		return c.processFile(fi, c.untar)
	case "bz2":
		return c.processFile(fi, c.bunzip)
	}

	return nil
}

func (c *FileContext) Add(name string, r io.Reader) (*FileInfo, error) {
	tempFile, err := os.CreateTemp("", "")
	if err != nil {
		return nil, err
	}

	if _, err := io.Copy(tempFile, r); err != nil {
		return nil, err
	}

	if _, err := tempFile.Seek(0, 0); err != nil {
		return nil, err
	}

	hasher := sha256.New()
	if _, err := io.Copy(hasher, tempFile); err != nil {
		return nil, err
	}

	if _, err := tempFile.Seek(0, 0); err != nil {
		return nil, err
	}

	fileType, err := filetype.MatchReader(tempFile)
	if err != nil {
		return nil, err
	}

	tempFile.Close()

	fi := &FileInfo{
		Name:     name,
		Checksum: fmt.Sprintf("%x", hasher.Sum(nil)),
		File:     tempFile,
		FilePath: tempFile.Name(),
		FileType: fileType,
	}

	c.files = append(c.files, fi)

	return fi, nil
}

func (c *FileContext) Find(ext string) []*FileInfo {
	res := []*FileInfo{}
	for _, f := range c.files {
		if f.FileType.Extension == ext {
			res = append(res, f)
		}
	}
	return res
}

func (c *FileContext) Close() {
	for _, f := range c.files {
		if f.File != nil {
			f.File.Close()
			os.Remove(f.File.Name())
		}
	}
}

func (c *FileContext) unzip(fileInfo *FileInfo) error {
	fileStat, err := fileInfo.File.Stat()
	if err != nil {
		return err
	}

	zr, err := zip.NewReader(fileInfo.File, fileStat.Size())
	if err != nil {
		return err
	}

	for _, file := range zr.File {
		f, err := file.Open()
		if err != nil {
			return err
		}

		if file.FileInfo().IsDir() {
			continue
		}

		if err := c.Open(fmt.Sprintf("%s/%s", fileInfo.Name, file.Name), f); err != nil {
			return err
		}
	}

	return nil
}

func (c *FileContext) untar(fileInfo *FileInfo) error {
	r := tar.NewReader(fileInfo.File)
	for {
		file, err := r.Next()
		if err != nil && err != io.EOF {
			return err
		} else if err != nil {
			break
		}

		if err := c.Open(fmt.Sprintf("%s/%s", fileInfo.Name, file.Name), r); err != nil {
			return err
		}
	}

	return nil
}

func (c *FileContext) bunzip(fileInfo *FileInfo) error {
	r := bzip2.NewReader(fileInfo.File)

	return c.Open(fmt.Sprintf("%s/%s", fileInfo.Name, fileInfo.Name[:len(fileInfo.Name)-3]), r)
}

func (c *FileContext) gunzip(fileInfo *FileInfo) error {
	r, err := gzip.NewReader(fileInfo.File)
	if err != nil {
		return err
	}
	defer r.Close()

	return c.Open(fmt.Sprintf("%s/%s", fileInfo.Name, fileInfo.Name[:len(fileInfo.Name)-3]), r)
}

func NewFileContext(ctx context.Context) *FileContext {
	return &FileContext{
		Context: ctx,
		files:   []*FileInfo{},
	}
}

func init() {
	filetype.AddMatcher(types.Type{
		MIME:      types.NewMIME("application/xml"),
		Extension: "xml",
	}, func(data []byte) bool {
		bom := []byte{0xEF, 0xBB, 0xBF}
		bl := len(bom)
		xmlMagic := []byte("<?xml ")
		ml := bl + len(xmlMagic)

		if ml > len(data) {
			return false
		}

		s := data[0:ml]
		hasBOM := false
		for i := 0; i < bl; i++ {
			if bom[i] != s[i] {
				hasBOM = false
				break
			}
			hasBOM = true
		}
		offset := 0
		if hasBOM {
			offset = bl
		}
		for i := 0; i < len(xmlMagic); i++ {
			if xmlMagic[i] != s[i+offset] {
				return false
			}
		}

		return true
	})
}
