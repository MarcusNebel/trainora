package routes

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"trainora/session"
)

// --- Decrypt, Encrypt and ParseUserID fuctions are from /routes/ollama.go ---

// --- Settings Routes ---
func RegisterSettingsRoutes(api fiber.Router, db *sql.DB) {
	settings := api.Group("/settings", AuthMiddleware)

	// GET: User Info laden
	settings.Get("/user-info", func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		if userIDRaw == nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}
		userID, err := parseUserID(userIDRaw)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültige Session"})
		}

		var birthdayEnc, heightEnc, weightEnc, goalEnc, activityEnc, allergiesEnc, email, username string
		err = db.QueryRow(`SELECT birthday_encrypted, height_cm_encrypted, weight_kg_encrypted, goal_encrypted, activity_level_encrypted, allergies_encrypted, email, username FROM users WHERE id = ?`, userID).
			Scan(&birthdayEnc, &heightEnc, &weightEnc, &goalEnc, &activityEnc, &allergiesEnc, &email, &username)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Laden der Nutzerdaten"})
		}

		birthday, _ := decryptText(birthdayEnc)
		birthdayParts := strings.Split(birthday, "-")
		day, month, year := "", "", ""
		if len(birthdayParts) == 3 {
			year, month, day = birthdayParts[0], birthdayParts[1], birthdayParts[2]
		}

		height, _ := decryptText(heightEnc)
		weight, _ := decryptText(weightEnc)
		goal, _ := decryptText(goalEnc)
		activity, _ := decryptText(activityEnc)
		allergies, _ := decryptText(allergiesEnc)

		return c.JSON(fiber.Map{
			"birthday_day":   day,
			"birthday_month": month,
			"birthday_year":  year,
			"height_cm":      height,
			"weight_kg":      weight,
			"goal":           goal,
			"activity_level": activity,
			"allergies":      allergies,
			"email":          email,
			"username":       username,
		})
	})

	// POST: User Info aktualisieren
	settings.Post("/update-user-info", func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		if userIDRaw == nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}
		userID, err := parseUserID(userIDRaw)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültige Session"})
		}

		var input struct {
			Birthday      struct {
				Day   string `json:"day"`
				Month string `json:"month"`
				Year  string `json:"year"`
			} `json:"birthday"`
			HeightCm      interface{} `json:"height_cm"` // kann number oder string sein
			WeightKg      interface{} `json:"weight_kg"` // kann number oder string sein
			Goal          string      `json:"goal"`
			ActivityLevel string      `json:"activity_level"`
			Allergies     string      `json:"allergies"`
		}

		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Ungültige Eingabe", "details": err.Error()})
		}

		birthday := fmt.Sprintf("%s-%s-%s", input.Birthday.Year, input.Birthday.Month, input.Birthday.Day)

		// height / weight in string konvertieren
		heightStr := fmt.Sprintf("%v", input.HeightCm)
		weightStr := fmt.Sprintf("%v", input.WeightKg)

		birthdayEnc, _ := encryptText(birthday)
		heightEnc, _ := encryptText(heightStr)
		weightEnc, _ := encryptText(weightStr)
		goalEnc, _ := encryptText(input.Goal)
		activityEnc, _ := encryptText(input.ActivityLevel)
		allergiesEnc, _ := encryptText(input.Allergies)

		_, err = db.Exec(`
			UPDATE users
			SET birthday_encrypted = ?, height_cm_encrypted = ?, weight_kg_encrypted = ?, goal_encrypted = ?, activity_level_encrypted = ?, allergies_encrypted = ?
			WHERE id = ?`,
			birthdayEnc, heightEnc, weightEnc, goalEnc, activityEnc, allergiesEnc, userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Speichern der Nutzerdaten", "details": err.Error()})
		}

		return c.JSON(fiber.Map{"message": "Persönliche Informationen erfolgreich gespeichert"})
	})

	// POST: Passwort ändern
	settings.Post("/update-password", func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		if userIDRaw == nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}
		userID, err := parseUserID(userIDRaw)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültige Session"})
		}

		var input struct {
			OldPassword string `json:"old_password"`
			NewPassword string `json:"new_password"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Ungültige Eingabe"})
		}

		var hash string
		err = db.QueryRow(`SELECT password_hash FROM users WHERE id = ?`, userID).Scan(&hash)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Laden des Passworts"})
		}

		if bcrypt.CompareHashAndPassword([]byte(hash), []byte(input.OldPassword)) != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Altes Passwort falsch"})
		}

		newHash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		_, err = db.Exec(`UPDATE users SET password_hash = ? WHERE id = ?`, newHash, userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Speichern des neuen Passworts"})
		}

		return c.JSON(fiber.Map{"message": "Passwort erfolgreich geändert"})
	})

	// POST: Kontoinformationen aktualisieren
	settings.Post("/update-account-info", func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		if userIDRaw == nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}
		userID, err := parseUserID(userIDRaw)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ungültige Session"})
		}

		var input struct {
			Email    string `json:"email"`
			Username string `json:"username"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Ungültige Eingabe"})
		}

		var existingID int
		// Prüfen E-Mail
		err = db.QueryRow("SELECT id FROM users WHERE email = ? AND id != ?", input.Email, userID).Scan(&existingID)
		if err != sql.ErrNoRows && err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "DB-Fehler"})
		}
		if existingID != 0 {
			return c.Status(400).JSON(fiber.Map{"error": "E-Mail bereits vergeben"})
		}

		// Prüfen Username
		err = db.QueryRow("SELECT id FROM users WHERE username = ? AND id != ?", input.Username, userID).Scan(&existingID)
		if err != sql.ErrNoRows && err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "DB-Fehler"})
		}
		if existingID != 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Benutzername bereits vergeben"})
		}

		// Update
		_, err = db.Exec("UPDATE users SET email = ?, username = ? WHERE id = ?", input.Email, input.Username, userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Speichern"})
		}

		return c.JSON(fiber.Map{"message": "Kontoinformationen erfolgreich aktualisiert"})
	})
}
