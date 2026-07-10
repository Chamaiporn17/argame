<?php
// update_score.php - AJAX Endpoint to update high score
session_start();
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

// 1. Verify user session
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized access. Please login first.'
    ]);
    exit();
}

$user_id = $_SESSION['user_id'];

// 2. Parse JSON Input
$inputData = json_decode(file_get_contents('php://input'), true);

if (!isset($inputData['score'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing score parameter.'
    ]);
    exit();
}

$new_score = intval($inputData['score']);

if ($new_score < 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid score value.'
    ]);
    exit();
}

try {
    // 3. Query current high score
    $stmt = $pdo->prepare("SELECT high_score FROM users WHERE id = :id");
    $stmt->execute(['id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found.'
        ]);
        exit();
    }

    $current_high_score = intval($user['high_score']);
    $updated = false;

    // 4. Update ONLY if the new score is strictly greater than the current record
    if ($new_score > $current_high_score) {
        $update_stmt = $pdo->prepare("UPDATE users SET high_score = :score WHERE id = :id");
        $update_stmt->execute([
            'score' => $new_score,
            'id' => $user_id
        ]);
        
        $current_high_score = $new_score;
        $_SESSION['high_score'] = $new_score; // update session value
        $updated = true;
    }

    echo json_encode([
        'status' => 'success',
        'updated' => $updated,
        'current_high' => $updated ? $new_score : $current_high_score,
        'new_high_score' => $current_high_score
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
