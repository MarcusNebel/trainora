package routes

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	
	"health-coach/session"
)

func RegisterAuthRoutes(api fiber.Router) {
	api.Post("/login", loginHandler)
	api.Get("/logout", logoutHandler)
	api.Get("/me", AuthMiddleware, MeHandler)
}

func generateRememberToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func AuthMiddleware(c *fiber.Ctx) error {
	sess, _ := session.Store.Get(c)
	if sess.Get("user_id") != nil {
		return c.Next()
	}

	token := c.Cookies("remember_token")
	if token == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
	}

	var userID int
	err := Db.QueryRow("SELECT id FROM users WHERE remember_token = ?", token).Scan(&userID)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Ungültiger Token"})
	}

	sess.Set("user_id", userID)
	sess.Save()

	return c.Next()
}

func loginHandler(c *fiber.Ctx) error {
	var input struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Ungültige Eingabe"})
	}

	var id int
	var hash string
	var setupCompleted string

	err := Db.QueryRow(
		"SELECT id, password_hash, setup_completed FROM users WHERE username = ? OR email = ?",
		input.Login, input.Login,
	).Scan(&id, &hash, &setupCompleted)

	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(input.Password)) != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Benutzername/E-Mail oder Passwort falsch"})
	}

	sess, err := session.Store.Get(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Session konnte nicht geladen werden"})
	}

	sess.Set("user_id", id)
	if err := sess.Save(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Session konnte nicht gespeichert werden"})
	}

	remember := c.Query("remember") == "true"
	if remember {
		token, err := generateRememberToken()
		if err == nil {
			_, _ = Db.Exec("UPDATE users SET remember_token = ? WHERE id = ?", token, id)

			c.Cookie(&fiber.Cookie{
				Name:     "remember_token",
				Value:    token,
				HTTPOnly: true,
				Secure:   false, // Setze auf true bei HTTPS!
				SameSite: "Lax",
				Path:     "/",
				MaxAge:   60 * 60 * 24 * 30, // 30 Tage
			})
		}
	}

	// 👇 Hier den setupCompleted-Wert mit zurückgeben
	return c.JSON(fiber.Map{
		"message":         "Login erfolgreich",
		"user_id":         id,
		"setup_completed": setupCompleted, // <-- wichtig für Frontend
	})
}

func logoutHandler(c *fiber.Ctx) error {
	sess, _ := session.Store.Get(c)
	userID := sess.Get("user_id")
	sess.Destroy()

	if userID != nil {
		_, _ = Db.Exec("UPDATE users SET remember_token = NULL WHERE id = ?", userID)
	}

	c.Cookie(&fiber.Cookie{
		Name:     "remember_token",
		Value:    "",
		MaxAge:   -1,
		Path:     "/",
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
	})

	return c.JSON(fiber.Map{"message": "Erfolgreich ausgeloggt"})
}

func MeHandler(c *fiber.Ctx) error {
	sess, err := session.Store.Get(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Session-Fehler"})
	}

	userID := sess.Get("user_id")
	if userID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
	}

	return c.JSON(fiber.Map{"user_id": userID})
}
