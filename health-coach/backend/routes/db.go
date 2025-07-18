package routes

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/go-sql-driver/mysql"
)

var Db *sql.DB // Groß geschrieben → exportiert

func InitDB() {
	_ = godotenv.Load()

	dsn := os.Getenv("MYSQL_USER") + ":" + os.Getenv("MYSQL_PASSWORD") +
		"@tcp(" + os.Getenv("MYSQL_HOST") + ":" + os.Getenv("MYSQL_PORT") + ")/" +
		os.Getenv("MYSQL_DB") + "?parseTime=true"

	var err error
	maxRetries := 10
	for i := 0; i < maxRetries; i++ {
		Db, err = sql.Open("mysql", dsn)
		if err != nil {
			log.Printf("Versuch %d: DB-Verbindung fehlgeschlagen: %v", i+1, err)
		} else if err = Db.Ping(); err != nil {
			log.Printf("Versuch %d: DB nicht erreichbar: %v", i+1, err)
		} else {
			log.Println("✅ DB-Verbindung erfolgreich")
			return
		}
		log.Println("⏳ Warte 2 Sekunden bis zum nächsten Versuch...")
		time.Sleep(2 * time.Second)
	}

	log.Fatal("❌ Datenbank konnte nach mehreren Versuchen nicht erreicht werden.")
}
