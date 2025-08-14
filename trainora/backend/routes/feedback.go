package routes

import (
    "database/sql"

    "github.com/gofiber/fiber/v2"
    "trainora/session"
)

// Feedback-API registrieren
func RegisterFeedbackRoutes(api fiber.Router, db *sql.DB) {
    api.Post("/set-feedback", AuthMiddleware, func(c *fiber.Ctx) error {
        type FeedbackRequest struct {
            TaskID         int64  `json:"task_id"`
            FeedbackOption string `json:"feedback_option"`
            Feedback       string `json:"feedback"`
        }
        var req FeedbackRequest
        if err := c.BodyParser(&req); err != nil {
            return c.Status(400).JSON(fiber.Map{"error": "Ungültige Anfrage"})
        }

        sess, _ := session.Store.Get(c)
        userID, err := parseUserID(sess.Get("user_id"))
        if err != nil {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Nicht eingeloggt"})
        }

        _, err = db.Exec(`
            UPDATE task_schedule
            SET feedback_option = ?, feedback = ?
            WHERE user_id = ? AND task_id = ?
        `, req.FeedbackOption, req.Feedback, userID, req.TaskID)
        if err != nil {
            return c.Status(500).JSON(fiber.Map{"error": "DB-Fehler", "details": err.Error()})
        }
        return c.JSON(fiber.Map{"success": true})
    })
}