package routes

import (
	"database/sql"
	"encoding/json"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"trainora/session"
)

type Recipe struct {
	ID           int      `json:"id"`
	UserID       int64    `json:"user_id"` // user_id als int64 (kann anpassen je nach DB)
	Title        string   `json:"title"`
	Ingredients  []string `json:"ingredients"`  // Ingredients sind JSON-Array im DB-Feld (TEXT)
	Instructions string   `json:"instructions"`
	CreatedAt    string   `json:"created_at"`
}

type Exercise struct {
	ID          int      `json:"id"`
	UserID      int64    `json:"user_id"`
	Name        string   `json:"name"`
	Duration    int      `json:"duration"`   // Dauer in Sekunden/Minuten (int)
	Description string   `json:"description"`
	CreatedAt   string   `json:"created_at"`
}

func RegisterGetRoutes(api fiber.Router, db *sql.DB) {
	api.Get("/get-recipes", AuthMiddleware, func(c *fiber.Ctx) error {
		sess, err := session.Store.Get(c)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Session nicht gefunden"})
		}
		userID, err := parseUserID(sess.Get("user_id"))
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		rows, err := db.Query(`
			SELECT id, user_id, title, ingredients, instructions, created_at 
			FROM recipes 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT 10`, userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Laden der Rezepte"})
		}
		defer rows.Close()

		var recipes []Recipe
		for rows.Next() {
			var r Recipe
			var ingredientsJSON string
			err := rows.Scan(&r.ID, &r.UserID, &r.Title, &ingredientsJSON, &r.Instructions, &r.CreatedAt)
			if err != nil {
				continue
			}
			err = json.Unmarshal([]byte(ingredientsJSON), &r.Ingredients)
			if err != nil {
				// Falls JSON fehlerhaft, leeres Array setzen
				r.Ingredients = []string{}
			}
			recipes = append(recipes, r)
		}

		return c.JSON(recipes)
	})

	api.Get("/get-exercises", AuthMiddleware, func(c *fiber.Ctx) error {
		sess, err := session.Store.Get(c)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Session nicht gefunden"})
		}
		userID, err := parseUserID(sess.Get("user_id"))
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		rows, err := db.Query(`
			SELECT id, user_id, name, duration, description, created_at 
			FROM exercises 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT 10`, userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Fehler beim Laden der Übungen"})
		}
		defer rows.Close()

		var exercises []Exercise
		for rows.Next() {
			var ex Exercise
			err := rows.Scan(&ex.ID, &ex.UserID, &ex.Name, &ex.Duration, &ex.Description, &ex.CreatedAt)
			if err != nil {
				continue
			}
			exercises = append(exercises, ex)
		}

		return c.JSON(exercises)
	})
}

func parseUserID(val interface{}) (int64, error) {
	switch v := val.(type) {
	case int:
		return int64(v), nil
	case int64:
		return v, nil
	case float64:
		return int64(v), nil
	case string:
		return strconv.ParseInt(v, 10, 64)
	default:
		return 0, fiber.NewError(fiber.StatusUnauthorized, "Ungültiger user_id Typ")
	}
}
