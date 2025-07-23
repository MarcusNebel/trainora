CREATE DATABASE IF NOT EXISTS trainora;
USE trainora;

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

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    estimated_duration_minutes INT,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    weekday TINYINT NOT NULL, -- 0 = Sonntag, 6 = Samstag
    day_period ENUM('morning', 'noon', 'afternoon', 'evening', 'anytime') NOT NULL,
    week_start_date DATE NOT NULL,
    feedback TEXT DEFAULT NULL,
    feedback_option ENUM('none', 'too_hard', 'didnt_like', 'not_possible') DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
