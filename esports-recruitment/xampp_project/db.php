<?php
// db.php - Database connection using PDO for XAMPP (Localhost)

$host = 'localhost';
$dbname = 'esports_db';
$username = 'root';
$password = '';

try {
    // Establish PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Enable exceptions for errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Fetch associative arrays by default
        PDO::ATTR_EMULATE_PREPARES => false, // Use real prepared statements for security
    ]);
} catch (PDOException $e) {
    // Stop execution and show error in case of failure
    die("Database Connection Failed: " . $e->getMessage());
}
?>
