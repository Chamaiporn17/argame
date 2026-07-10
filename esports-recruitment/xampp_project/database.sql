-- Create database for Esports Recruitment System
CREATE DATABASE IF NOT EXISTS `esports_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `esports_db`;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `player_id` VARCHAR(20) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fullname` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `high_score` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
