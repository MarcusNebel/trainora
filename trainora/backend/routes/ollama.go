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
	"trainora/session"
	"crypto/aes"
	"crypto/cipher"
)

// Funktion, um Wochenbeginn (Montag) zu berechnen
func getWeekStartDateOllama(t time.Time) time.Time {
    weekday := int(t.Weekday())
    // In Go: Sonntag = 0, Montag = 1, ..., Samstag = 6
    // Wir wollen auf Montag zurücksetzen
    daysToSubtract := (weekday + 6) % 7
    return t.AddDate(0, 0, -daysToSubtract)
}

// Hilfsfunktion: Wochenbeginn für nächste Woche berechnen
func getNextWeekStartDate() string {
    now := time.Now()
    weekday := int(now.Weekday())
    daysToSubtract := (weekday + 6) % 7
    monday := now.AddDate(0, 0, -daysToSubtract)
    nextMonday := monday.AddDate(0, 0, 7)
    return nextMonday.Format("2006-01-02")
}

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

func generateWeekPlan(db *sql.DB, userID int64, weekStartDate string) error {
    // Nutzerdaten laden und entschlüsseln (wie in /after-setup)
    var (
        birthdayEnc, heightEnc, weightEnc, goalEnc, activityEnc, allergiesEnc string
    )
    err := db.QueryRow(`SELECT birthday_encrypted, height_cm_encrypted, weight_kg_encrypted, goal_encrypted, activity_level_encrypted, allergies_encrypted FROM users WHERE id = ?`, userID).
        Scan(&birthdayEnc, &heightEnc, &weightEnc, &goalEnc, &activityEnc, &allergiesEnc)
    if err != nil {
        return err
    }

    birthdayStr, err := decryptText(birthdayEnc)
    if err != nil { return err }
    heightStr, err := decryptText(heightEnc)
    if err != nil { return err }
    weightStr, err := decryptText(weightEnc)
    if err != nil { return err }
    goalStr, _ := decryptText(goalEnc)
    activityStr, _ := decryptText(activityEnc)
    allergyStr, _ := decryptText(allergiesEnc)

    birthday, err := time.Parse("2006-01-02", birthdayStr)
    if err != nil { return err }
    age := time.Now().Year() - birthday.Year()
    if time.Now().YearDay() < birthday.YearDay() { age-- }
    height, err := strconv.Atoi(heightStr)
    if err != nil { return err }
    weight, err := strconv.ParseFloat(weightStr, 64)
    if err != nil { return err }

    prompt := fmt.Sprintf(`You are a health coach. The user is %d years old, weighs %.1f kg, is %d cm tall,
    has the goal "%s", an activity level of "%s", and the following allergies: "%s".
    The user wants to live a healthier lifestyle.

    Please create a complete weekly fitness plan with daily tasks for each day of the week, starting with Monday (weekday 1) and ending with Sunday (weekday 0).

    Each task should include:
    - "title": a short name of the task in German
    - "description": a detailed description in German
    - "duration": estimated duration in minutes
    - "day_period": one of the following time periods: "morning", "noon", "afternoon", "evening", or "anytime"

    Return the response strictly as a JSON object with the following format:

    {
    "week_plan": {
        "0": [  // Monday
        {
            "title": "...",
            "description": "...",
            "duration": 10,
            "day_period": "morning"
        }
        ],
        "1": [],
        "2": [],
        "3": [],
        "4": [],
        "5": [],
        "6": []
    }
    }

    Do not include any explanation or extra text outside the JSON.
    Only output the JSON object.
    `, age, weight, height, goalStr, activityStr, allergyStr)

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
    if err != nil { return err }
    defer resp.Body.Close()

    decoder := json.NewDecoder(resp.Body)
    var responseText strings.Builder
    for {
        var chunk struct {
            Response string `json:"response"`
        }
        err := decoder.Decode(&chunk)
        if err == io.EOF { break }
        if err != nil { return err }
        responseText.WriteString(chunk.Response)
    }

    raw := responseText.String()
    start := strings.Index(raw, "{")
    end := strings.LastIndex(raw, "}")
    if start == -1 || end == -1 || end <= start {
        return errors.New("Keine gültige JSON-Antwort gefunden")
    }
    jsonPart := raw[start : end+1]

    type Task struct {
        Title       string `json:"title"`
        Description string `json:"description"`
        Duration    int    `json:"duration"`
        DayPeriod   string `json:"day_period"`
    }
    type WeekPlan map[string][]Task

    type OllamaResponse struct {
        WeekPlan WeekPlan `json:"week_plan"`
    }

    var ollamaResp OllamaResponse
    err = json.Unmarshal([]byte(jsonPart), &ollamaResp)
    if err != nil { return err }

    tx, err := db.Begin()
    if err != nil { return err }

    for dayStr, tasks := range ollamaResp.WeekPlan {
        weekday, err := strconv.Atoi(dayStr)
        if err != nil {
            tx.Rollback()
            return err
        }
        for _, task := range tasks {
            res, err := tx.Exec(`INSERT INTO tasks (title, description, estimated_duration_minutes, created_by) VALUES (?, ?, ?, ?)`,
                task.Title, task.Description, task.Duration, userID)
            if err != nil {
                tx.Rollback()
                return err
            }
            taskID, err := res.LastInsertId()
            if err != nil {
                tx.Rollback()
                return err
            }
            // weekStartDate ist hier der Parameter!
            _, err = tx.Exec(`
                INSERT INTO task_schedule (user_id, task_id, weekday, day_period, week_start_date, feedback_option)
                VALUES (?, ?, ?, ?, ?, 'none')
            `, userID, taskID, weekday, task.DayPeriod, weekStartDate)
            if err != nil {
                tx.Rollback()
                return err
            }
        }
    }

    if err := tx.Commit(); err != nil {
        return err
    }

    return nil
}

func RegisterOllamaRoutes(api fiber.Router, db *sql.DB) {
	ollama := api.Group("/ollama")
	ollama.Post("/after-setup", AuthMiddleware, func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		var userID int64
		switch v := userIDRaw.(type) {
			case int: userID = int64(v)
			case int64: userID = v
			case float64: userID = int64(v)
			case string:
				parsed, err := strconv.ParseInt(v, 10, 64)
				if err != nil { /* Fehlerbehandlung */ }
				userID = parsed
			default:
				// Fehlerbehandlung
		}
		weekStartDate := getWeekStartDateOllama(time.Now()).Format("2006-01-02")
		err := generateWeekPlan(db, userID, weekStartDate)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Fehler beim Generieren des Wochenplans", "details": err.Error()})
		}
		return c.JSON(fiber.Map{"message": "Wochenplan erfolgreich generiert"})
	})

	ollama.Post("/generate-next-week", AuthMiddleware, func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		var userID int64
		switch v := userIDRaw.(type) {
			case int: userID = int64(v)
			case int64: userID = v
			case float64: userID = int64(v)
			case string:
				parsed, err := strconv.ParseInt(v, 10, 64)
				if err != nil { /* Fehlerbehandlung */ }
				userID = parsed
			default:
				// Fehlerbehandlung
		}
		nextWeekStart := getNextWeekStartDate()

		// Prüfen, ob schon Einträge existieren
		var count int
		err := db.QueryRow(`SELECT COUNT(*) FROM task_schedule WHERE user_id = ? AND week_start_date = ?`, userID, nextWeekStart).Scan(&count)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "DB-Fehler", "db_error": err.Error()})
		}
		if count > 0 {
			return c.JSON(fiber.Map{"message": "Plan für nächste Woche existiert bereits"})
		}

		// Nur wenn noch kein Plan existiert, generieren!
		err = generateWeekPlan(db, userID, nextWeekStart)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Fehler beim Generieren des Wochenplans", "details": err.Error()})
		}
		return c.JSON(fiber.Map{"message": "Wochenplan erfolgreich generiert"})
	})
}
