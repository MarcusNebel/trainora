package routes

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"trainora/session"
)

type Recipe struct {
	ID           int      `json:"id"`
	UserID       int64    `json:"user_id"`
	Title        string   `json:"title"`
	Ingredients  []string `json:"ingredients"` // JSON-Array im DB-Feld (TEXT)
	Instructions string   `json:"instructions"`
	CreatedAt    string   `json:"created_at"`
}

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int    `json:"duration"`   // Hier passt der Name, nur in DB heißt es estimated_duration_minutes
	DayPeriod   string `json:"day_period"`
}

func getWeekStartDateGFDB(t time.Time) string {
    weekday := int(t.Weekday())
    daysToSubtract := (weekday + 6) % 7
    monday := t.AddDate(0, 0, -daysToSubtract)
    return monday.Format("2006-01-02")
}

func RegisterGetRoutes(api fiber.Router, db *sql.DB) {
    api.Get("/get-week-plan", AuthMiddleware, func(c *fiber.Ctx) error {
		// Session abrufen
		sess, err := session.Store.Get(c)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Session nicht gefunden"})
		}

		// User-ID aus Session parsen
		userID, err := parseUserID(sess.Get("user_id"))
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
		}

		// Aktuellen Wochenbeginn berechnen
        weekStartDate := getWeekStartDateGFDB(time.Now())

		// SQL-Abfrage für geplante Tasks der aktuellen Woche
        rows, err := db.Query(`
            SELECT ts.weekday, t.title, t.description, t.estimated_duration_minutes, ts.day_period
            FROM task_schedule ts
            JOIN tasks t ON ts.task_id = t.id
            WHERE ts.user_id = ? AND ts.week_start_date = ?
            ORDER BY ts.weekday ASC, FIELD(ts.day_period, 'morning','noon','afternoon','evening','anytime')
        `, userID, weekStartDate)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":    "Fehler beim Laden des Wochenplans",
				"db_error": err.Error(),
			})
		}
		defer rows.Close()

		// week_plan mit 0–6 initialisieren
		weekPlan := make(map[string][]Task)
		for i := 0; i < 7; i++ {
			weekPlan[strconv.Itoa(i)] = []Task{}
		}

		// Zeilen durchgehen und strukturieren
		for rows.Next() {
			var weekday int
			var t Task
			err := rows.Scan(&weekday, &t.Title, &t.Description, &t.Duration, &t.DayPeriod)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error":      "Fehler beim Verarbeiten der Daten",
					"scan_error": err.Error(),
				})
			}
			dayKey := strconv.Itoa(weekday)
			weekPlan[dayKey] = append(weekPlan[dayKey], t)
		}

		return c.JSON(fiber.Map{
			"week_plan": weekPlan,
		})
	})
}

// Helper-Funktion: UserID sicher in int64 konvertieren
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
