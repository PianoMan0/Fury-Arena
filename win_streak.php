<?php

$db = new PDO('sqlite:win_streak.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS streaks (
    username TEXT PRIMARY KEY,
    win_streak INTEGER DEFAULT 0
)");

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$won = isset($_POST['won']) ? $_POST['won'] : '0';

if ($username !== '') {
    // Get current streak
    $stmt = $db->prepare("SELECT win_streak FROM streaks WHERE username = ?");
    $stmt->execute([$username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $streak = $row['win_streak'];
        if ($won === '1') {
            $streak += 1;
        } else {
            $streak = 0;
        }
        // Update streak
        $stmt = $db->prepare("UPDATE streaks SET win_streak = ? WHERE username = ?");
        $stmt->execute([$streak, $username]);
    } else {
        $streak = $won === '1' ? 1 : 0;
        $stmt = $db->prepare("INSERT INTO streaks (username, win_streak) VALUES (?, ?)");
        $stmt->execute([$username, $streak]);
    }
    echo json_encode(['win_streak' => $streak]);
} else {
    echo json_encode(['win_streak' => 0]);
}