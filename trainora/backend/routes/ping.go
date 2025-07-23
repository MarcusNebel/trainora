package routes

import "github.com/gofiber/fiber/v2"

// RegisterPingRoute registriert den Ping-Endpunkt
func RegisterPingRoute(api fiber.Router) {
	api.Get("/ping", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "pong",
			"status":  "ok",
		})
	})
}