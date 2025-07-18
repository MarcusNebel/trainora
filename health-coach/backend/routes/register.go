package routes

import (
    "database/sql"
    "os"

    "github.com/gofiber/fiber/v2"
    "golang.org/x/crypto/bcrypt"
    _ "github.com/go-sql-driver/mysql"
    "github.com/joho/godotenv"
)

func init() {
    // .env laden (falls nicht schon geschehen)
    _ = godotenv.Load()
    user := os.Getenv("MYSQL_USER")
    pass := os.Getenv("MYSQL_PASSWORD")
    host := os.Getenv("MYSQL_HOST")
    port := os.Getenv("MYSQL_PORT")
    name := os.Getenv("MYSQL_DB")
    dsn := user + ":" + pass + "@tcp(" + host + ":" + port + ")/" + name + "?parseTime=true"
    var err error
    Db, err = sql.Open("mysql", dsn)
    if err != nil {
        panic("DB-Verbindung fehlgeschlagen: " + err.Error())
    }
}

func RegisterUserRoutes(api fiber.Router) {
    api.Post("/register", registerHandler)
}

func CheckEmail(c *fiber.Ctx) error {
    email := c.Query("email")
    var exists bool
    err := Db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=?)", email).Scan(&exists)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "DB-Fehler"})
    }
    return c.JSON(fiber.Map{"exists": exists})
}

func CheckUsername(c *fiber.Ctx) error {
    username := c.Query("username")
    var exists bool
    err := Db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username=?)", username).Scan(&exists)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "DB-Fehler"})
    }
    return c.JSON(fiber.Map{"exists": exists})
}

func registerHandler(c *fiber.Ctx) error {
    var input struct {
        Username string `json:"username"`
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    if err := c.BodyParser(&input); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    // Passwort hashen (bcrypt)
    hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Hashing failed"})
    }

    // In DB speichern
   encryptedBirthday, err := encryptText("2000-01-01")
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Verschlüsselung fehlgeschlagen"})
    }

    _, err = Db.Exec(
        "INSERT INTO users (username, email, password_hash, birthday_encrypted) VALUES (?, ?, ?, ?)",
        input.Username, input.Email, string(hash), encryptedBirthday,
    )
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()}) // <-- gibt die echte DB-Fehlermeldung zurück
	}

    return c.JSON(fiber.Map{"message": "Registrierung erfolgreich", "user": input.Username})
}