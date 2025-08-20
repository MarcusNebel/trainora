package routes

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
)

type VerifyCodeRequest struct {
	Code string `json:"code"`
}

// /api/verify-code Endpoint
func RegisterVerifyCodeRoute(api fiber.Router, db *sql.DB) {
	api.Post("/verify-code", func(c *fiber.Ctx) error {
		req := new(VerifyCodeRequest)
		if err := c.BodyParser(req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültige Anfrage",
			})
		}

		// Code prüfen
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

		// Ablaufdatum prüfen
		if time.Now().After(expiresAt) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Code ist abgelaufen",
			})
		}

		// Wichtig: Code wird hier NICHT gelöscht!
		// Damit er noch für /reset-password gültig bleibt

		return c.JSON(fiber.Map{
			"message": "Code gültig",
			"email":   email,
		})
	})
}