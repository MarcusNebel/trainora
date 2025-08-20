package routes

import (
	"crypto/rand"
	"database/sql"
	"io/ioutil"
	"net/smtp"
	"os"
	"time"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

type MailRequest struct {
	To string `json:"to"`
}

// Code generieren
func generateCode(length int) (string, error) {
	const charset = "0123456789"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b), nil
}

func RegisterMailRoutes(api fiber.Router, db *sql.DB) {
	api.Post("/sendcode", func(c *fiber.Ctx) error {
		_ = godotenv.Load()

		req := new(MailRequest)
		if err := c.BodyParser(req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültige Anfrage",
			})
		}

		// Code generieren
		code, err := generateCode(6)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Fehler bei Codegenerierung",
			})
		}

		// Ablaufzeit: jetzt + 15 Minuten
		expiry := time.Now().Add(15 * time.Minute)

		// In DB speichern
		_, err = db.Exec("INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)", req.To, code, expiry)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Fehler beim Speichern in DB: " + err.Error(),
			})
		}

		// HTML-Template laden
		templateBytes, err := ioutil.ReadFile("templates/verification_code.html")
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Fehler beim Laden des Templates",
			})
		}
		body := string(templateBytes)
		body = replaceCode(body, code)

		// SMTP Konfig
		smtpHost := "smtp.gmail.com"
		smtpPort := "587"
		sender := os.Getenv("EMAIL_ADDRESS")
		password := os.Getenv("EMAIL_APP_PASSWORD")
		displayName := os.Getenv("EMAIL_DISPLAY_NAME")

		auth := smtp.PlainAuth("", sender, password, smtpHost)

		// MIME-Header für HTML-Mail
		message := []byte("From: " + displayName + " <" + sender + ">\r\n" +
			"To: " + req.To + "\r\n" +
			"Subject: Dein Login-Code\r\n" +
			"MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n" +
			body)

		err = smtp.SendMail(smtpHost+":"+smtpPort, auth, sender, []string{req.To}, message)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Fehler beim Senden: " + err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"message": "Code gesendet!",
		})
	})
}

func replaceCode(template, code string) string {
    return strings.ReplaceAll(template, "{{code}}", code)
}