package routes

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
	"os"
	"path/filepath"
	"trainora/session"
)

// Pfad, wo die Profilbilder gespeichert werden
const ProfilePictureDir = "/app/public/profile_pictures"

func RegisterProfileRoutes(app fiber.Router) {
	profile := app.Group("/profile")
	// Upload eines Profilbildes
	profile.Post("/upload", AuthMiddleware, func(c *fiber.Ctx) error {
		sess, _ := session.Store.Get(c)
		userIDRaw := sess.Get("user_id")
		var userID string
		switch v := userIDRaw.(type) {
		case int:
			userID = fmt.Sprintf("%d", v)
		case int64:
			userID = fmt.Sprintf("%d", v)
		case float64:
			userID = fmt.Sprintf("%d", int64(v))
		case string:
			userID = v
		default:
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		file, err := c.FormFile("profile_picture")
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Keine Datei erhalten"})
		}

		if _, err := os.Stat(ProfilePictureDir); os.IsNotExist(err) {
			os.MkdirAll(ProfilePictureDir, os.ModePerm)
		}

		filename := fmt.Sprintf("%s%s", userID, filepath.Ext(file.Filename))
		err = c.SaveFile(file, filepath.Join(ProfilePictureDir, filename))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Upload fehlgeschlagen"})
		}

		return c.JSON(fiber.Map{"message": "Profilbild erfolgreich hochgeladen"})
	})

	// Löschen eines Profilbildes
	profile.Delete("/delete/:userId", AuthMiddleware, func(c *fiber.Ctx) error {
		userId := c.Params("userId")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Keine UserID angegeben"})
		}

		files, _ := filepath.Glob(filepath.Join(ProfilePictureDir, fmt.Sprintf("%s.*", userId)))
		for _, f := range files {
			os.Remove(f)
		}

		return c.JSON(fiber.Map{"message": "Profilbild gelöscht"})
	})

	// Profilbild abrufen
	profile.Get("/pictures/:userId", func(c *fiber.Ctx) error {
		userId := c.Params("userId")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).SendString("Keine UserID angegeben")
		}

		files, _ := filepath.Glob(filepath.Join(ProfilePictureDir, fmt.Sprintf("%s.*", userId)))
		if len(files) == 0 {
			return c.SendFile("./public/default-avatar.png")
		}

		return c.SendFile(files[0])
	})
}
