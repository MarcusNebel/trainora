package routes

import (
    "github.com/gofiber/fiber/v2"
)

type HealthRequest struct {
    Age    int     `json:"age"`
    Height int     `json:"height"`
    Weight float64 `json:"weight"`
}

func RegisterHealthRoutes(api fiber.Router) {
    api.Post("/health-advice", healthAdviceHandler)
}

func healthAdviceHandler(c *fiber.Ctx) error {
    var req HealthRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }
    // ...dein Prompt-Code hier...
    return c.JSON(fiber.Map{"message": "Hier käme die Antwort"})
}