CREATE DATABASE IF NOT EXISTS health_coach;
USE health_coach;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    remember_token VARCHAR(64) DEFAULT NULL,

    birthday_encrypted BLOB DEFAULT NULL,
    height_cm_encrypted BLOB DEFAULT NULL,
    weight_kg_encrypted BLOB DEFAULT NULL,
    goal_encrypted BLOB DEFAULT NULL,
    activity_level_encrypted BLOB DEFAULT NULL,

    allergies_encrypted BLOB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    setup_completed ENUM('yes', 'no') DEFAULT 'no'
);

CREATE TABLE recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                -- Zuordnung zu Nutzer (Fremdschlüssel)
    title VARCHAR(255) NOT NULL,        -- Rezepttitel
    ingredients TEXT NOT NULL,           -- Zutaten, z.B. JSON-Array oder Textliste
    instructions TEXT NOT NULL,          -- Zubereitungsschritte
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                -- Zuordnung zu Nutzer (Fremdschlüssel)
    name VARCHAR(255) NOT NULL,          -- Übungsname
    duration INT NOT NULL,                -- Dauer in Sekunden oder Minuten
    description TEXT NOT NULL,            -- Beschreibung der Übung
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
