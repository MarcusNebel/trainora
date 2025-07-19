package routes

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"health-coach/session"
	"crypto/aes"
	"crypto/cipher"
)

func decryptText(enc string) (string, error) {
	key := os.Getenv("SECRET_KEY")
	if len(key) != 64 {
		return "", errors.New("Ungültiger Schlüssel in .env")
	}
	keyBytes, _ := hex.DecodeString(key)
	ciphertext, err := base64.StdEncoding.DecodeString(enc)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return "", err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("Ciphertext zu kurz")
	}
	nonce, ct := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plain, err := aesGCM.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func RegisterOllamaRoutes(api fiber.Router, db *sql.DB) {
	ollama := api.Group("/ollama")
	ollama.Post("/after-setup", AuthMiddleware, func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")

		var userID int64
		switch v := userIDRaw.(type) {
		case int:
			userID = int64(v)
		case int64:
			userID = v
		case float64:
			userID = int64(v)
		case string:
			parsed, err := strconv.ParseInt(v, 10, 64)
			if err != nil {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Ungültige user_id"})
			}
			userID = parsed
		default:
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Ungültiger user_id Typ"})
		}
		if userID == 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		var (
			birthdayEnc, heightEnc, weightEnc, goalEnc, activityEnc, allergiesEnc string
		)
		err := db.QueryRow(`SELECT birthday_encrypted, height_cm_encrypted, weight_kg_encrypted, goal_encrypted, activity_level_encrypted, allergies_encrypted FROM users WHERE id = ?`, userID).
			Scan(&birthdayEnc, &heightEnc, &weightEnc, &goalEnc, &activityEnc, &allergiesEnc)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Laden der Nutzerdaten"})
		}

		birthdayStr, err := decryptText(birthdayEnc)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Entschlüsseln des Geburtsdatums"})
		}
		heightStr, err := decryptText(heightEnc)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Entschlüsseln der Größe"})
		}
		weightStr, err := decryptText(weightEnc)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Entschlüsseln des Gewichts"})
		}
		goalStr, _ := decryptText(goalEnc)
		activityStr, _ := decryptText(activityEnc)
		allergyStr, _ := decryptText(allergiesEnc)

		birthday, err := time.Parse("2006-01-02", birthdayStr)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültiges Geburtsdatum im System"})
		}
		age := time.Now().Year() - birthday.Year()
		if time.Now().YearDay() < birthday.YearDay() {
			age--
		}
		height, err := strconv.Atoi(heightStr)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültige Größe im System"})
		}
		weight, err := strconv.ParseFloat(weightStr, 64)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültiges Gewicht im System"})
		}

		prompt := fmt.Sprintf(`Du bist ein deutschsprachiger Gesundheitscoach. Der Nutzer ist %d Jahre alt, wiegt %.1f kg, ist %d cm groß,
hat das Ziel "%s", ein Aktivitätslevel von "%s" und folgende Allergien: "%s".
Er möchte gesünder leben.

1. Empfiehl ein gesundes Rezept, das zu ihm passt (einfach, proteinreich, wenige Zutaten).
2. Schlage eine passende Fitnessübung für zuhause vor (ca. 5–10 Minuten, ohne Geräte).

Antworte ausschließlich auf Deutsch und gib die Antwort in folgender JSON-Struktur zurück:
{
  "recipe": {
    "title": "...",
    "ingredients": ["..."],
    "instructions": "..."
  },
  "exercise": {
    "name": "...",
    "duration": ...,
    "description": "..."
  }
}`, age, weight, height, goalStr, activityStr, allergyStr)

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
			return c.Status(500).JSON(fiber.Map{"error": "Ollama request failed"})
		}
		defer resp.Body.Close()

		decoder := json.NewDecoder(resp.Body)
		var responseText strings.Builder
		for {
			var chunk struct {
				Response string `json:"response"`
			}
			err := decoder.Decode(&chunk)
			if err == io.EOF {
				break
			}
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Streaming failed: " + err.Error()})
			}
			responseText.WriteString(chunk.Response)
		}

		raw := responseText.String()
		start := strings.Index(raw, "{")
		end := strings.LastIndex(raw, "}")
		if start == -1 || end == -1 || end <= start {
			return c.Status(500).JSON(fiber.Map{"error": "Keine gültige JSON-Antwort gefunden"})
		}
		jsonPart := raw[start : end+1]

		type Recipe struct {
			Title        string   `json:"title"`
			Ingredients  []string `json:"ingredients"`
			Instructions string   `json:"instructions"`
		}
		type Exercise struct {
			Name        string `json:"name"`
			Duration    int    `json:"duration"`
			Description string `json:"description"`
		}
		type OllamaResponse struct {
			Recipe   Recipe   `json:"recipe"`
			Exercise Exercise `json:"exercise"`
		}

		var ollamaResp OllamaResponse
		err = json.Unmarshal([]byte(jsonPart), &ollamaResp)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Parsen der Antwort: " + err.Error()})
		}

		// Rezept speichern
		ingredientsJSON, err := json.Marshal(ollamaResp.Recipe.Ingredients)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verarbeiten der Zutaten"})
		}
		_, err = db.Exec(
			`INSERT INTO recipes (user_id, title, ingredients, instructions) VALUES (?, ?, ?, ?)`,
			userID, ollamaResp.Recipe.Title, ingredientsJSON, ollamaResp.Recipe.Instructions)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Speichern des Rezepts"})
		}

		// Übung speichern
		_, err = db.Exec(
			`INSERT INTO exercises (user_id, name, duration, description) VALUES (?, ?, ?, ?)`,
			userID, ollamaResp.Exercise.Name, ollamaResp.Exercise.Duration, ollamaResp.Exercise.Description)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Speichern der Übung"})
		}

		return c.JSON(fiber.Map{
			"recipe":   ollamaResp.Recipe,
			"exercise": ollamaResp.Exercise,
		})
	})
}
