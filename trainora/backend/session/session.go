package session

import "github.com/gofiber/fiber/v2/middleware/session"

// Store ist die zentrale Session-Instanz für das gesamte Projekt
var Store = session.New()
