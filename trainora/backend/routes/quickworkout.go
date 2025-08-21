package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"trainora/session"
)

// Request-Daten vom Frontend
type QuickWorkoutRequest struct {
	Duration  int    `json:"duration"`  // in Minuten
	Goal      string `json:"goal"`      // z.B. Kraft, Ausdauer, Flexibilität
	Equipment string `json:"equipment"` // z.B. "none", "dumbbells", "bands"
}

// Struktur für Ollama-Antwort
type QuickWorkout struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int    `json:"duration"`
}

// Funktion für Quick Workout Generierung
func generateQuickWorkout(req QuickWorkoutRequest) (QuickWorkout, error) {
	prompt := fmt.Sprintf(`Du bist ein Fitness Coach. Erstelle ein kurzes Workout in Deutsch.

Rahmenbedingungen:
- Dauer: ca. %d Minuten
- Ziel/Fokus: %s
- Verfügbares Equipment: %s

Das Workout soll realistisch und für den Nutzer sofort umsetzbar sein.

Liefere das Workout als JSON im Format:
{
  "title": "Kurzer Workout-Titel",
  "description": "Beschreibung der Übungen und Ablauf, auf Deutsch.",
  "duration": <Dauer in Minuten>
}

Keine weiteren Erklärungen, nur reines JSON.`, req.Duration, req.Goal, req.Equipment)

	type OllamaRequest struct {
		Model     string `json:"model"`
		Prompt    string `json:"prompt"`
		KeepAlive string `json:"keep_alive"`
	}

	ollamaPayload := OllamaRequest{
		Model:     "gemma3:12b",
		Prompt:    prompt,
		KeepAlive: "24h",
	}

	payloadBytes, _ := json.Marshal(ollamaPayload)

	resp, err := http.Post("http://ollama:11434/api/generate", "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return QuickWorkout{}, err
	}
	defer resp.Body.Close()

	decoder := json.NewDecoder(resp.Body)
	var buffer strings.Builder

	for {
		var chunk struct {
			Response string `json:"response"`
		}
		if err := decoder.Decode(&chunk); err == io.EOF {
			break
		} else if err != nil {
			return QuickWorkout{}, err
		}
		buffer.WriteString(chunk.Response)
	}

	// Rohdaten säubern: Backticks, Leerzeilen, ggf. json-Header entfernen
	raw := buffer.String()
	raw = strings.TrimSpace(raw)
	raw = strings.Trim(raw, "`")          // führende/abschließende Backticks entfernen
	raw = strings.TrimPrefix(raw, "json") // führendes 'json' entfernen, falls vorhanden
	raw = strings.TrimSpace(raw)

	var workout QuickWorkout
	if err := json.Unmarshal([]byte(raw), &workout); err != nil {
		return QuickWorkout{}, fmt.Errorf("Fehler beim Parsen der Ollama Antwort: %v\nAntwort war: %s", err, raw)
	}

	return workout, nil
}

// Route registrieren
func RegisterQuickWorkoutRoutes(api fiber.Router) {
	api.Post("/quick-workout", func(c *fiber.Ctx) error {
		// Session/User holen
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")

		if userIDRaw == nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		// UserID normalisieren (optional, nur wenn du sie brauchst)
		switch v := userIDRaw.(type) {
		case string:
			if _, err := strconv.ParseInt(v, 10, 64); err != nil {
				return c.Status(401).JSON(fiber.Map{"error": "Ungültige user_id"})
			}
		}

		// Body lesen
		var req QuickWorkoutRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Ungültige Anfrage", "details": err.Error()})
		}

		// Workout generieren
		workout, err := generateQuickWorkout(req)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler bei Generierung", "details": err.Error()})
		}

		// Ergebnis direkt an Frontend senden
		return c.JSON(workout)
	})
}
