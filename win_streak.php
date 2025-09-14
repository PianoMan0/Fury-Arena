<?php

$db = new PDO('sqlite:win_streak.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS streaks (
    username TEXT PRIMARY KEY,
    win_streak INTEGER DEFAULT 0
)");

$db->exec("CREATE TABLE IF NOT EXISTS coins (
    username TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0
)");

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$won = isset($_POST['won']) ? $_POST['won'] : '0';

if ($username !== '') {
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
        $stmt = $db->prepare("UPDATE streaks SET win_streak = ? WHERE username = ?");
        $stmt->execute([$streak, $username]);
    } else {
        $streak = $won === '1' ? 1 : 0;
        $stmt = $db->prepare("INSERT INTO streaks (username, win_streak) VALUES (?, ?)");
        $stmt->execute([$username, $streak]);
    }

    // Give 10 coins per win
    $coinsEarned = ($won === '1') ? 10 : 0;
    $stmt = $db->prepare("SELECT coins FROM coins WHERE username = ?");
    $stmt->execute([$username]);
    $coinRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($coinRow) {
        $coins = $coinRow['coins'] + $coinsEarned;
        $stmt = $db->prepare("UPDATE coins SET coins = ? WHERE username = ?");
        $stmt->execute([$coins, $username]);
    } else {
        $coins = $coinsEarned;
        $stmt = $db->prepare("INSERT INTO coins (username, coins) VALUES (?, ?)");
        $stmt->execute([$username, $coins]);
    }

    echo json_encode(['win_streak' => $streak, 'coins' => $coins, 'coins_earned' => $coinsEarned]);
} else {
    echo json_encode(['win_streak' => 0, 'coins' => 0, 'coins_earned' => 0]);
}