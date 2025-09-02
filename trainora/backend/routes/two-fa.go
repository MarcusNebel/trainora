package routes

import (
	"database/sql"
	"net/http"
	"trainora/session"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/pquerna/otp/totp"
)

// RegisterSetup2FARoutes registriert alle 2FA-Routen unter /api/2fa
func RegisterSetup2FARoutes(api fiber.Router, db *sql.DB) {
	twofa := api.Group("/2fa")

	// 1. Setup (Secret generieren & QR-Code zurückgeben)
	twofa.Post("/setup", func(c *fiber.Ctx) error {
		userID, err := GetUserIDFromSession(c)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		var email string
		if err := db.QueryRow("SELECT email FROM users WHERE id = ?", userID).Scan(&email); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "User nicht gefunden"})
		}

		key, err := totp.Generate(totp.GenerateOpts{
			Issuer:      "Trainora",
			AccountName: email,
		})
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Fehler beim Generieren des 2FA-Keys"})
		}

		if _, err := db.Exec("UPDATE users SET twofa_secret = ? WHERE id = ?", key.Secret(), userID); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "DB Fehler"})
		}

		return c.JSON(fiber.Map{
			"otpauth_url": key.URL(),
			"secret":      key.Secret(),
		})
	})

	// 2. Enable (Code prüfen & aktivieren)
	twofa.Post("/enable", func(c *fiber.Ctx) error {
		type Body struct {
			Code string `json:"code"`
		}
		var body Body
		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Ungültiger Body"})
		}

		userID, err := GetUserIDFromSession(c)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		var secret string
		if err := db.QueryRow("SELECT twofa_secret FROM users WHERE id = ?", userID).Scan(&secret); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "User nicht gefunden"})
		}

		if !totp.Validate(body.Code, secret) {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Ungültiger Code"})
		}

		if _, err := db.Exec("UPDATE users SET twofa_enabled = TRUE WHERE id = ?", userID); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "DB Fehler"})
		}

		return c.JSON(fiber.Map{"success": true})
	})

	// 3. Verify (Login-Zweitprüfung)
	twofa.Post("/verify", func(c *fiber.Ctx) error {
		type Body struct {
			Code string `json:"code"`
		}
		var body Body
		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Ungültiger Body"})
		}

		userID, err := GetUserIDFromSession(c)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		var secret string
		var enabled bool
		if err := db.QueryRow("SELECT twofa_secret, twofa_enabled FROM users WHERE id = ?", userID).Scan(&secret, &enabled); err != nil || !enabled {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "2FA nicht aktiviert"})
		}

		if !totp.Validate(body.Code, secret) {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Ungültiger Code"})
		}

		// Session markieren
		sess, err := session.Store.Get(c)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Session Fehler"})
		}
		sess.Set("2fa_verified", true)
		sess.Save()

		return c.JSON(fiber.Map{"success": true})
	})

	// 4. Verify Login (2FA während des Logins)
	twofa.Post("/verify-login", func(c *fiber.Ctx) error {
		type Body struct {
			Code string `json:"code"`
		}
		var body Body
		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Ungültiger Body"})
		}

		// Session laden
		sess, err := session.Store.Get(c)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Session Fehler"})
		}

		pendingUserID, ok := sess.Get("pending_user_id").(int)
		if !ok || pendingUserID == 0 {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Keine 2FA ausstehend"})
		}

		// Secret aus DB laden
		var secret string
		var enabled bool
		if err := db.QueryRow("SELECT twofa_secret, twofa_enabled FROM users WHERE id = ?", pendingUserID).
			Scan(&secret, &enabled); err != nil || !enabled {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "2FA nicht aktiviert"})
		}

		// Code prüfen
		if !totp.Validate(body.Code, secret) {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Ungültiger Code"})
		}

		// 2FA erfolgreich → richtige Session setzen
		sess.Delete("pending_user_id")
		sess.Set("user_id", pendingUserID)
		sess.Set("2fa_verified", true)
		if err := sess.Save(); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Session konnte nicht gespeichert werden"})
		}

		return c.JSON(fiber.Map{"success": true, "message": "2FA erfolgreich abgeschlossen"})
	})

	// 4. Disable (2FA ausschalten)
	twofa.Post("/disable", func(c *fiber.Ctx) error {
		userID, err := GetUserIDFromSession(c)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		if _, err := db.Exec("UPDATE users SET twofa_enabled = FALSE, twofa_secret = NULL WHERE id = ?", userID); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "DB Fehler"})
		}

		return c.JSON(fiber.Map{"success": true})
	})

	twofa.Get("/status", func(c *fiber.Ctx) error {

		userID, err := GetUserIDFromSession(c)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		var twoFAEnabled bool
		err = db.QueryRow("SELECT twofa_enabled FROM users WHERE id = ?", userID).Scan(&twoFAEnabled)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "DB-Fehler"})
		}

		return c.JSON(fiber.Map{
			"enabled": twoFAEnabled,
		})
	})
}

func GetUserIDFromSession(c *fiber.Ctx) (int64, error) {
	sess, err := session.Store.Get(c)
	if err != nil {
		return 0, err
	}

	userIDRaw := sess.Get("user_id")
	if userIDRaw == nil {
		return 0, errors.New("user not logged in")
	}

	switch v := userIDRaw.(type) {
	case int:
		return int64(v), nil
	case int64:
		return v, nil
	case float64:
		return int64(v), nil
	case string:
		parsed, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return 0, errors.New("invalid user_id format")
		}
		return parsed, nil
	default:
		return 0, errors.New("unknown user_id type")
	}
}