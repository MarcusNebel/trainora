package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

type HealthRequest struct {
	Age    int     `json:"age"`
	Height int     `json:"height"` // in cm
	Weight float64 `json:"weight"` // in kg
}

type OllamaRequest struct {
	Model     string `json:"model"`
	Prompt    string `json:"prompt"`
	KeepAlive string `json:"keep_alive"`
}

func main() {
	app := fiber.New()
	app.Use(cors.New())

	api := app.Group("/api") // Alle Routen unter /api

	api.Post("/health-advice", func(c *fiber.Ctx) error {
		var req HealthRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}

		// Prompt bauen
		prompt := "Du bist ein deutschsprachiger Gesundheitscoach. Der Nutzer ist " +
				strconv.Itoa(req.Age) + " Jahre alt, wiegt " +
				strconv.FormatFloat(req.Weight, 'f', 1, 64) + " kg und ist " +
				strconv.Itoa(req.Height) + " cm groß.\n" +
				"Er möchte gesünder leben.\n\n" +
				"1. Empfiehl ein gesundes Rezept, das zu ihm passt (einfach, proteinreich, wenige Zutaten).\n" +
				"2. Schlage eine passende Fitnessübung für zuhause vor (ca. 5–10 Minuten, ohne Geräte).\n\n" +
				"Antworte **ausschließlich auf Deutsch** und gib die Antwort in **folgender JSON-Struktur** zurück:\n\n" +
				`{
			"recipe": {
				"title": "...",
				"ingredients": ["..."],
				"instructions": "..."
			},
			"exercise": {
				"name": "...",
				"duration": ...,
				"description": "..."
			}
		}`

		ollamaPayload := OllamaRequest{
			Model:     "llama3",
			Prompt:    prompt,
			KeepAlive: "24h", // oder "true" oder "24h"
		}

		 payloadBytes, _ := json.Marshal(ollamaPayload)
		resp, err := http.Post("http://ollama:11434/api/generate", "application/json", bytes.NewBuffer(payloadBytes))
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ollama request failed"})
		}
		defer resp.Body.Close()

		decoder := json.NewDecoder(resp.Body)
		var responseText string

		for {
			var chunk struct {
				Response string `json:"response"`
			}
			err := decoder.Decode(&chunk)
			if err == io.EOF {
				break
			}
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Streaming failed: " + err.Error()})
			}
			responseText += chunk.Response
		}

		return c.JSON(fiber.Map{
			"response": responseText,
		})
	})

	app.Listen(":3000")
}
