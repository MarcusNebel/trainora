package main
import "github.com/gofiber/fiber/v2/middleware/cors"

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type AskRequest struct {
	Prompt string `json:"prompt"`
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type OllamaResponse struct {
	Response string `json:"response"`
}

func main() {
	app := fiber.New()
	app.Use(cors.New())

	app.Post("/ask", func(c *fiber.Ctx) error {
	var req AskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	ollamaPayload := OllamaRequest{
		Model:  "llama3",
		Prompt: req.Prompt,
	}

	payloadBytes, _ := json.Marshal(ollamaPayload)
	resp, err := http.Post("http://ollama:11434/api/generate", "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ollama request failed"})
	}
	defer resp.Body.Close()

	var responseText string
	decoder := json.NewDecoder(resp.Body)

	for {
		var chunk map[string]interface{}
		if err := decoder.Decode(&chunk); err == io.EOF {
			break
		} else if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Streaming failed"})
		}

		if text, ok := chunk["response"].(string); ok {
			responseText += text
		}
	}

	return c.JSON(fiber.Map{
		"response": responseText,
	})
})
	app.Listen(":3000")

//summarize
	app.Post("/summarize", func(c *fiber.Ctx) error {
	var req AskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	ollamaPayload := OllamaRequest{
		Model:  "llama3",
		Prompt: "Fasse den folgenden Text kurz und präzise zusammen:\n\n" + req.Prompt,
	}

	payloadBytes, _ := json.Marshal(ollamaPayload)
	resp, err := http.Post("http://ollama:11434/api/generate", "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ollama request failed"})
	}
	defer resp.Body.Close()

	var responseText string
	decoder := json.NewDecoder(resp.Body)

	for {
		var chunk map[string]interface{}
		if err := decoder.Decode(&chunk); err == io.EOF {
			break
		} else if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Streaming failed"})
		}

		if text, ok := chunk["response"].(string); ok {
			responseText += text
		}
	}

	return c.JSON(fiber.Map{
		"summary": responseText,
	})
})
}