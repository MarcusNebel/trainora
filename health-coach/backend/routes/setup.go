package routes

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"health-coach/session"
)

func RegisterSetupRoutes(api fiber.Router) {
	api.Post("/setup", AuthMiddleware, handleSetupSubmission)
}

type SetupInput struct {
	Birthday      struct{ Day, Month, Year string } `json:"birthday"`
	Height        int                            `json:"height_cm"`
	Weight        int                            `json:"weight_kg"`
	ActivityLevel string                         `json:"activity_level"`
	Goal          string                         `json:"goal"`
	Allergies     string                         `json:"allergies"`
}

func handleSetupSubmission(c *fiber.Ctx) error {
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

	var input SetupInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Ungültige Daten"})
	}

	birthdayStr := fmt.Sprintf("%s-%s-%s", input.Birthday.Year, input.Birthday.Month, input.Birthday.Day)
	_, err := time.Parse("2006-01-02", birthdayStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Ungültiges Geburtsdatum"})
	}

	// Verschlüsseln aller Felder
	encBirthday, err := encryptText(birthdayStr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verschlüsseln von Geburtstag"})
	}
	encHeight, err := encryptText(strconv.Itoa(input.Height))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verschlüsseln von Größe"})
	}
	encWeight, err := encryptText(strconv.Itoa(input.Weight))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verschlüsseln von Gewicht"})
	}
	encActivity, err := encryptText(input.ActivityLevel)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verschlüsseln von Aktivitätslevel"})
	}
	encGoal, err := encryptText(input.Goal)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verschlüsseln von Ziel"})
	}
	encAllergies, err := encryptText(input.Allergies)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Verschlüsseln von Allergien"})
	}

	_, err = Db.Exec(`
		UPDATE users SET 
			birthday_encrypted = ?, 
			height_cm_encrypted = ?, 
			weight_kg_encrypted = ?, 
			activity_level_encrypted = ?, 
			goal_encrypted = ?, 
			allergies_encrypted = ?, 
			setup_completed = 'yes' 
		WHERE id = ?
	`, encBirthday, encHeight, encWeight, encActivity, encGoal, encAllergies, userID)

	if err != nil {
		fmt.Printf("DB Update Fehler: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Speichern der Daten"})
	}

	return c.JSON(fiber.Map{"message": "success"})
}

func encryptText(plain string) (string, error) {
	key := os.Getenv("SECRET_KEY")
	if len(key) != 64 {
		return "", errors.New("Ungültiger Schlüssel in .env")
	}

	keyBytes, _ := hex.DecodeString(key)
	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	_, err = rand.Read(nonce)
	if err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plain), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}
