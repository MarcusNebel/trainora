package routes

import (
	"github.com/gofiber/fiber/v2"
	"health-coach/session"
)

// Diese Funktion registriert die Route
func RegisterDeleteAccountRoute(api fiber.Router) {
	api.Delete("/delete-account", AuthMiddleware, DeleteAccountHandler)
}

// Handler, der den eingeloggten Account löscht
func DeleteAccountHandler(c *fiber.Ctx) error {
	sess, err := session.Store.Get(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Session konnte nicht geladen werden"})
	}

	userID := sess.Get("user_id")
	if userID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
	}

	// Hier wird die Datenbankverbindung verwendet, um den Account zu löschen
	_, err = Db.Exec("DELETE FROM users WHERE id = ?", userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Account konnte nicht gelöscht werden"})
	}

	// Hier wird die Datenbankverbindung verwendet, um die Rezepte zu löschen
	_, err = Db.Exec("DELETE FROM recipes WHERE user_id = ?", userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Rezepte konnten nicht gelöscht werden"})
	}

	// Hier wird die Datenbankverbindung verwendet, um die Übungen zu löschen
	_, err = Db.Exec("DELETE FROM exercises WHERE user_id = ?", userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Übungen konnten nicht gelöscht werden"})
	}

	sess.Destroy()

	c.Cookie(&fiber.Cookie{
		Name:     "remember_token",
		Value:    "",
		MaxAge:   -1,
		Path:     "/",
		HTTPOnly: true,
		Secure:   false, // bei HTTPS auf true setzen
		SameSite: "Lax",
	})

	return c.JSON(fiber.Map{"message": "Account erfolgreich gelöscht"})
}
