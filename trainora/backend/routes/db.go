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
			break
		}
		if i == maxRetries-1 {
			log.Fatal("❌ Datenbank konnte nach mehreren Versuchen nicht erreicht werden.")
		}
		log.Println("⏳ Warte 2 Sekunden bis zum nächsten Versuch...")
		time.Sleep(2 * time.Second)
	}

	// Sicherstellen, dass die Spalten existieren
	columns := []struct {
		Name    string
		Def     string
		Default string
	}{
		{"is_generating_week", "BOOLEAN", "FALSE"},
		{"is_generating_next_week", "BOOLEAN", "FALSE"},
	}

	for _, col := range columns {
		var exists string
		query := `SELECT COLUMN_NAME 
				  FROM INFORMATION_SCHEMA.COLUMNS 
				  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`
		err := Db.QueryRow(query, os.Getenv("MYSQL_DB"), col.Name).Scan(&exists)
		if err == sql.ErrNoRows {
			// Spalte existiert nicht → hinzufügen
			alter := "ALTER TABLE users ADD COLUMN " + col.Name + " " + col.Def + " DEFAULT " + col.Default
			_, err := Db.Exec(alter)
			if err != nil {
				log.Fatalf("❌ Fehler beim Hinzufügen der Spalte %s: %v", col.Name, err)
			}
			log.Printf("✅ Spalte %s wurde hinzugefügt", col.Name)
		} else if err != nil {
			log.Fatalf("❌ Fehler beim Prüfen der Spalte %s: %v", col.Name, err)
		} else {
			// Spalte existiert → sicherstellen, dass alle Werte FALSE sind
			_, err := Db.Exec("UPDATE users SET " + col.Name + " = FALSE WHERE " + col.Name + " IS NULL OR " + col.Name + " <> FALSE")
			if err != nil {
				log.Fatalf("❌ Fehler beim Zurücksetzen der Spalte %s: %v", col.Name, err)
			}
			log.Printf("✅ Spalte %s existiert und wurde auf FALSE zurückgesetzt", col.Name)
		}
	}
}
