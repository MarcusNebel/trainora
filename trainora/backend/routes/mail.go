package routes

import (
	"net/smtp"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

type MailRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func RegisterMailRoutes(api fiber.Router) {
	api.Post("/sendmail", sendMailHandler)
}

func sendMailHandler(c *fiber.Ctx) error {
	// .env laden (nur einmal im Projekt nötig, z.B. im main.go)
	_ = godotenv.Load()

	req := new(MailRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	sender := os.Getenv("EMAIL_ADDRESS")
	password := os.Getenv("EMAIL_APP_PASSWORD")
	sender_display := os.Getenv("EMAIL_DISPLAY_NAME")

	auth := smtp.PlainAuth("", sender, password, smtpHost)

	// Gmail erwartet "From:" im Header
	message := []byte("From: " + sender_display + " <" + sender + ">\r\n" +
		"To: " + req.To + "\r\n" +
		"Subject: " + req.Subject + "\r\n\r\n" +
		req.Body)

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, sender, []string{req.To}, message)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Senden: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "E-Mail erfolgreich gesendet!",
	})
}
