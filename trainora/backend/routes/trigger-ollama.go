package routes

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
	"log"
	"bytes"
)

var modelLoaded bool = false
var once sync.Once

func StartOllamaModelChecker() {
	go func() {
		for {
			if checkOllamaModel() {
				// Modell ist geladen, Schleife stoppen
				break
			}
			time.Sleep(2 * time.Second)
		}
	}()
}

// Gibt true zurück, wenn Modell geladen (also Anfrage erfolgreich)
func checkOllamaModel() bool {
	type OllamaRequest struct {
		Model     string `json:"model"`
		Prompt    string `json:"prompt"`
		KeepAlive string `json:"keep_alive"`
	}
	payload := OllamaRequest{
		Model:     "gemma3:12b",
		Prompt:    "Hallo",
		KeepAlive: "24h",
	}

	body, _ := json.Marshal(payload)
	resp, err := http.Post("http://ollama:11434/api/generate", "application/json", bytes.NewBuffer(body))
	if err != nil {
		log.Printf("❌ Fehler beim Senden an Ollama: %v. Wird in 2 Sekunden erneut versucht...", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		log.Println("⚠️ Ollama antwortete mit 404 - vermutlich Modell nicht geladen oder falsche Route.")
		return false
	} else if resp.StatusCode >= 400 {
		log.Printf("❌ Fehler von Ollama: %d %s", resp.StatusCode, resp.Status)
		return false
	}

	log.Println("✅ Anfrage erfolgreich an Ollama gesendet. Modell ist geladen.")
	return true
}
