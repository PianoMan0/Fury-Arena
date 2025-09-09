<?php


$db = new PDO('sqlite:win_streak.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
)");

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if ($username === '' || $password === '') {
    echo json_encode(['success'=>false, 'message'=>'Username and password required.']);
    exit;
}

// Check if user exists
$stmt = $db->prepare("SELECT password FROM users WHERE username = ?");
$stmt->execute([$username]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    if ($row['password'] === $password) {
        echo json_encode(['success'=>true, 'message'=>'Logged in']);
    } else {
        echo json_encode(['success'=>false, 'message'=>'Wrong password']);
    }
} else {
    // Register
    $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->execute([$username, $password]);
    echo json_encode(['success'=>true, 'message'=>'Account created and logged in']);
}