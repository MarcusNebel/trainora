package main

import (
	"crypto/rand"
	"encoding/hex"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"health-coach/routes"
)

func ensureEnvFile() error {
	content := ""

	if _, err := os.Stat(".env"); os.IsNotExist(err) {
		secret := make([]byte, 32)
		if _, err := rand.Read(secret); err != nil {
			return err
		}
		secretHex := hex.EncodeToString(secret)
		content = `SECRET_KEY=` + secretHex + `
MYSQL_USER=root
MYSQL_PASSWORD=59LWrt!mDo6GC4
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DB=health_coach
`
		return os.WriteFile(".env", []byte(content), 0600)
	}

	dotenv, err := godotenv.Read(".env")
	if err != nil {
		return err
	}

	if dotenv["SECRET_KEY"] == "" {
		secret := make([]byte, 32)
		if _, err := rand.Read(secret); err != nil {
			return err
		}
		secretHex := hex.EncodeToString(secret)
		dotenv["SECRET_KEY"] = secretHex
		return godotenv.Write(dotenv, ".env")
	}

	return nil
}

func main() {
	// .env ggf. automatisch anlegen
	if err := ensureEnvFile(); err != nil {
		panic("Konnte .env nicht anlegen: " + err.Error())
	}
	_ = godotenv.Load()

	app := fiber.New()
	app.Use(cors.New())

	api := app.Group("/api")

	// DB öffnen
	routes.InitDB()
    defer routes.Db.Close()

	// Starte Ollama Healthcheck
	routes.StartOllamaModelChecker()

	// API-Routen registrieren
	routes.RegisterHealthRoutes(api)
	routes.RegisterUserRoutes(api)
	routes.RegisterAuthRoutes(api)
	routes.RegisterSetupRoutes(api)
	routes.RegisterOllamaRoutes(api, routes.Db)
	routes.RegisterGetRoutes(api, routes.Db)
	routes.RegisterDeleteAccountRoute(api)

	// Hilfsrouten
	api.Get("/check-email", routes.CheckEmail)
	api.Get("/check-username", routes.CheckUsername)

	// Geschützte Routen (nur eingeloggte Benutzer)
	private := app.Group("/api/private", routes.AuthMiddleware)
	private.Get("/me", routes.MeHandler)
	private.Get("/recipes", routes.MeHandler)

	app.Listen(":3000")
}
