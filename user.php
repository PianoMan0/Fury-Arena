<?php

$db = new PDO('sqlite:win_streak.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS coins (
    username TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0
)");

$db->exec("CREATE TABLE IF NOT EXISTS owned_skins (
    username TEXT,
    skin TEXT,
    PRIMARY KEY (username, skin)
)");

$db->exec("CREATE TABLE IF NOT EXISTS selected_skin (
    username TEXT PRIMARY KEY,
    skin TEXT
)");

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';
$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($action === 'get_coins' && $username !== '') {
    $stmt = $db->prepare("SELECT coins FROM coins WHERE username = ?");
    $stmt->execute([$username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $coins = $row ? $row['coins'] : 0;

    // Skins owned
    $stmt = $db->prepare("SELECT skin FROM owned_skins WHERE username = ?");
    $stmt->execute([$username]);
    $skins = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    // Selected skin
    $stmt = $db->prepare("SELECT skin FROM selected_skin WHERE username = ?");
    $stmt->execute([$username]);
    $selected_skin = $stmt->fetchColumn();

    echo json_encode([
        'success'=>true,
        'coins'=>intval($coins),
        'owned_skins'=>$skins,
        'selected_skin'=>$selected_skin
    ]);
    exit;
}

if ($action === 'buy_skin' && $username !== '') {
    $skin = isset($_POST['skin']) ? $_POST['skin'] : '';
    $cost = isset($_POST['cost']) ? intval($_POST['cost']) : 0;

    // Check if already owned
    $stmt = $db->prepare("SELECT 1 FROM owned_skins WHERE username = ? AND skin = ?");
    $stmt->execute([$username, $skin]);
    if ($stmt->fetch()) {
        echo json_encode(['success'=>false, 'message'=>'Already owned']);
        exit;
    }

    // Check coins
    $stmt = $db->prepare("SELECT coins FROM coins WHERE username = ?");
    $stmt->execute([$username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $coins = $row ? $row['coins'] : 0;

    if ($coins < $cost) {
        echo json_encode(['success'=>false, 'message'=>'Not enough coins']);
        exit;
    }

    // Deduct coins and add skin
    $stmt = $db->prepare("UPDATE coins SET coins = coins - ? WHERE username = ?");
    $stmt->execute([$cost, $username]);
    $stmt = $db->prepare("INSERT INTO owned_skins (username, skin) VALUES (?, ?)");
    $stmt->execute([$username, $skin]);
    echo json_encode(['success'=>true, 'message'=>'Skin purchased']);
    exit;
}

if ($action === 'select_skin' && $username !== '') {
    $skin = isset($_POST['skin']) ? $_POST['skin'] : '';
    // Check ownership
    $stmt = $db->prepare("SELECT 1 FROM owned_skins WHERE username = ? AND skin = ?");
    $stmt->execute([$username, $skin]);
    if (!$stmt->fetch()) {
        echo json_encode(['success'=>false, 'message'=>'Skin not owned']);
        exit;
    }
    $stmt = $db->prepare("INSERT OR REPLACE INTO selected_skin (username, skin) VALUES (?, ?)");
    $stmt->execute([$username, $skin]);
    echo json_encode(['success'=>true, 'message'=>'Skin selected']);
    exit;
}

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
    // Give default skin
    $stmt = $db->prepare("INSERT INTO owned_skins (username, skin) VALUES (?, ?)");
    $stmt->execute([$username, 'blue']);
    $stmt = $db->prepare("INSERT INTO selected_skin (username, skin) VALUES (?, ?)");
    $stmt->execute([$username, 'blue']);
    echo json_encode(['success'=>true, 'message'=>'Account created and logged in']);
}