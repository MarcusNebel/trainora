package session

import (
    "os"
    "path/filepath"
    "sync"
    "time"
    "io/ioutil"
    "github.com/gofiber/storage"
)

type FileStore struct {
    dir string
    mu  sync.RWMutex
}

var _ storage.Storage = (*FileStore)(nil) // Explizit Interface implementieren

func NewFileStore(dir string) *FileStore {
    os.MkdirAll(dir, 0755)
    return &FileStore{dir: dir}
}

func (fs *FileStore) filePath(key string) string {
    return filepath.Join(fs.dir, key+".session")
}

func (fs *FileStore) Get(key string) ([]byte, error) {
    fs.mu.RLock()
    defer fs.mu.RUnlock()
    path := fs.filePath(key)
    if _, err := os.Stat(path); os.IsNotExist(err) {
        return nil, nil
    }
    return ioutil.ReadFile(path)
}

func (fs *FileStore) Set(key string, val []byte, ttl time.Duration) error {
    fs.mu.Lock()
    defer fs.mu.Unlock()
    // TTL ignorieren, aber du kannst ein Cleanup implementieren!
    return ioutil.WriteFile(fs.filePath(key), val, 0644)
}

func (fs *FileStore) Delete(key string) error {
    fs.mu.Lock()
    defer fs.mu.Unlock()
    return os.Remove(fs.filePath(key))
}

func (fs *FileStore) Reset() error {
    fs.mu.Lock()
    defer fs.mu.Unlock()
    files, err := ioutil.ReadDir(fs.dir)
    if err != nil {
        return err
    }
    for _, file := range files {
        os.Remove(filepath.Join(fs.dir, file.Name()))
    }
    return nil
}

func (fs *FileStore) Close() error {
    return nil
}