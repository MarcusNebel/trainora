package routes

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type ResetPasswordRequest struct {
	Code     string `json:"code"`
	Password string `json:"password"`
}

func RegisterResetPasswordRoute(api fiber.Router, db *sql.DB) {
	api.Post("/reset-password", func(c *fiber.Ctx) error {
		req := new(ResetPasswordRequest)
		if err := c.BodyParser(req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültige Anfrage",
			})
		}

		if len(req.Password) < 6 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Passwort zu kurz (mind. 6 Zeichen)",
			})
		}

		// Code erneut prüfen
		var email string
		var expiresAt time.Time
		err := db.QueryRow("SELECT email, expires_at FROM verification_codes WHERE code = ?", req.Code).Scan(&email, &expiresAt)
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültiger Code",
			})
		} else if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "DB-Fehler: " + err.Error(),
			})
		}

		if time.Now().After(expiresAt) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Code abgelaufen",
			})
		}

		// Neues Passwort hashen
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Fehler beim Hashen des Passworts",
			})
		}

		// Passwort in DB updaten
		_, err = db.Exec("UPDATE users SET password_hash = ? WHERE email = ?", hashedPassword, email)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Fehler beim Aktualisieren des Passworts: " + err.Error(),
			})
		}

		// Jetzt Code löschen (nur einmal verwendbar)
		_, _ = db.Exec("DELETE FROM verification_codes WHERE code = ?", req.Code)

		return c.JSON(fiber.Map{
			"message": "Passwort erfolgreich zurückgesetzt",
		})
	})
}