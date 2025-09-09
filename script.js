document.addEventListener('DOMContentLoaded', () => {
    const loginArea = document.getElementById('loginArea');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('loginMessage');
    const gameArea = document.getElementById('gameArea');
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    const winSound = document.getElementById('winSound');
    const gameOverMenu = document.getElementById('gameOverMenu');
    const gameDurationElem = document.getElementById('gameDuration');
    const player1HealthElem = document.getElementById('player1Health');
    const player2HealthElem = document.getElementById('player2Health');
    const reloadButton = document.getElementById('reloadButton');
    const winnerMessageElem = document.getElementById('winnerMessage');
    const winStreakElem = document.getElementById('winStreakMessage');

    let player1Pos = { x: 100, y: 100 };
    let player2Pos = { x: 200, y: 200 };
    let player1HP = 100;
    let player2HP = 100;
    const speed = 5;
    const arrowSpeed = 10;
    const arrows = [];
    let gameDuration = 0;
    let gameInterval;
    let gameActive = false;
    let lastDirection = 'right';

    const initialGameAreaWidth = 600;
    const initialGameAreaHeight = 400;
    const minGameAreaSize = 200;

    let currentUser = null;

    class Arrow {
        constructor(x, y, direction, color, owner) {
            this.x = x;
            this.y = y;
            this.direction = direction;
            this.color = color;
            this.owner = owner;
            this.element = document.createElement('div');
            this.element.className = 'arrow';
            this.element.style.backgroundColor = color;
            this.element.style.position = 'absolute';
            this.element.style.width = '10px';
            this.element.style.height = '10px';
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            gameArea.appendChild(this.element);
        }
        move() {
            switch (this.direction) {
                case 'up': this.y -= arrowSpeed; break;
                case 'down': this.y += arrowSpeed; break;
                case 'left': this.x -= arrowSpeed; break;
                case 'right': this.x += arrowSpeed; break;
            }
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
        checkCollision(player) {
            const rect1 = this.element.getBoundingClientRect();
            const rect2 = player.getBoundingClientRect();
            return (
                rect1.left < rect2.left + rect2.width &&
                rect1.left + rect1.width > rect2.left &&
                rect1.top < rect2.top + rect2.height &&
                rect1.top + rect1.height > rect2.top
            );
        }
    }

    // Login/register
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        loginMessage.textContent = 'Loading...';
        fetch('user.php', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentUser = username;
                loginArea.style.display = 'none';
                gameArea.style.display = '';
                resetGame();
                gameActive = true;
            } else {
                loginMessage.textContent = data.message || 'Error logging in.';
            }
        })
        .catch(() => {
            loginMessage.textContent = 'Network error.';
        });
    });

    function checkPlayerCollision(pos1, pos2) {
        const playerSize = 20;
        return (
            pos1.x < pos2.x + playerSize &&
            pos1.x + playerSize > pos2.x &&
            pos1.y < pos2.y + playerSize &&
            pos1.y + playerSize > pos2.y
        );
    }

    function movePlayer(player, pos, key, otherPos) {
        if (!gameActive) return;
        const oldPos = { ...pos };
        let moved = false;
        switch (key) {
            case 'ArrowUp':
                if (pos.y - speed >= 0) { pos.y -= speed; lastDirection = 'up'; moved = true; }
                break;
            case 'ArrowDown':
                if (pos.y + speed <= gameArea.clientHeight - player.clientHeight) { pos.y += speed; lastDirection = 'down'; moved = true; }
                break;
            case 'ArrowLeft':
                if (pos.x - speed >= 0) { pos.x -= speed; lastDirection = 'left'; moved = true; }
                break;
            case 'ArrowRight':
                if (pos.x + speed <= gameArea.clientWidth - player.clientWidth) { pos.x += speed; lastDirection = 'right'; moved = true; }
                break;
        }
        if (checkPlayerCollision(pos, otherPos)) {
            pos.x = oldPos.x;
            pos.y = oldPos.y;
            return;
        }
        if (moved) {
            player.style.left = `${Math.max(0, Math.min(pos.x, gameArea.clientWidth - player.clientWidth))}px`;
            player.style.top = `${Math.max(0, Math.min(pos.y, gameArea.clientHeight - player.clientHeight))}px`;
        }
    }

    function shootArrow(player, pos, color, direction, owner) {
        const dir = owner === 'player1' ? lastDirection : direction;
        const arrow = new Arrow(
            pos.x + player.clientWidth / 2 - 5,
            pos.y + player.clientHeight / 2 - 5,
            dir,
            color,
            owner
        );
        arrows.push(arrow);
    }

    function checkCollision() {
        for (let i = arrows.length - 1; i >= 0; i--) {
            const arrow = arrows[i];
            if (arrow.owner === 'player2' && arrow.checkCollision(player1)) {
                player1HP = Math.max(0, player1HP - 10);
                arrow.element.remove();
                arrows.splice(i, 1);
                if (player1HP <= 0) {
                    winSound.play();
                    endGame("Player 2 wins!", false);
                }
            } else if (arrow.owner === 'player1' && arrow.checkCollision(player2)) {
                player2HP = Math.max(0, player2HP - 10);
                arrow.element.remove();
                arrows.splice(i, 1);
                if (player2HP <= 0) {
                    winSound.play();
                    endGame("You win!", true);
                }
            }
        }
    }

    function resetGame() {
        player1Pos = { x: 100, y: 100 };
        player2Pos = { x: 200, y: 200 };
        player1HP = 100;
        player2HP = 100;
        player1.style.left = `${player1Pos.x}px`;
        player1.style.top = `${player1Pos.y}px`;
        player2.style.left = `${player2Pos.x}px`;
        player2.style.top = `${player2Pos.y}px`;
        arrows.forEach(arrow => arrow.element.remove());
        arrows.length = 0;
        gameDuration = 0;
        gameActive = true;
        clearInterval(gameInterval);
        gameOverMenu.style.display = 'none';
        winnerMessageElem.innerText = '';
        winStreakElem.innerText = '';
        gameArea.style.width = `${initialGameAreaWidth}px`;
        gameArea.style.height = `${initialGameAreaHeight}px`;
    }

    function endGame(resultMessage, playerWon) {
        winnerMessageElem.innerText = resultMessage;
        gameDurationElem.innerText = `Duration: ${gameDuration.toFixed(2)} seconds`;
        player1HealthElem.innerText = `Player 1 Health: ${player1HP}`;
        player2HealthElem.innerText = `Player 2 Health: ${player2HP}`;
        gameOverMenu.style.display = 'block';
        gameActive = false;

        fetch('win_streak.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(currentUser)}&won=${playerWon ? '1' : '0'}`
        })
        .then(response => response.json())
        .then(data => {
            winStreakElem.innerText = `Your win streak: ${data.win_streak || 0}`;
        })
        .catch(() => {
            winStreakElem.innerText = "Win streak unavailable.";
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            movePlayer(player1, player1Pos, e.key, player2Pos);
        }
        if (e.key === ' ') {
            shootArrow(player1, player1Pos, 'blue', lastDirection, 'player1');
        }
    });

    function moveBot() {
        if (!gameActive) return;
        const dx = player1Pos.x - player2Pos.x;
        const dy = player1Pos.y - player2Pos.y;
        let botDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
            botDirection = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        } else {
            botDirection = dy > 0 ? 'ArrowDown' : 'ArrowUp';
        }
        movePlayer(player2, player2Pos, botDirection, player1Pos);
        if (Math.random() < 0.1) {
            let shootDir = botDirection.replace('Arrow', '').toLowerCase();
            shootArrow(player2, player2Pos, 'green', shootDir, 'player2');
        }
    }

    function shrinkGameArea() {
        const currentWidth = gameArea.clientWidth;
        const currentHeight = gameArea.clientHeight;
        if (currentWidth > minGameAreaSize && currentHeight > minGameAreaSize) {
            gameArea.style.width = `${Math.max(minGameAreaSize, currentWidth - 2)}px`;
            gameArea.style.height = `${Math.max(minGameAreaSize, currentHeight - 2)}px`;
        }
    }

    function updateArrows() {
        for (let i = arrows.length - 1; i >= 0; i--) {
            const arrow = arrows[i];
            arrow.move();
            if (
                arrow.x < 0 ||
                arrow.x > gameArea.clientWidth ||
                arrow.y < 0 ||
                arrow.y > gameArea.clientHeight
            ) {
                arrow.element.remove();
                arrows.splice(i, 1);
            }
        }
        checkCollision();
    }

    function applyTheme() {
        const hour = new Date().getHours();
        document.body.classList.toggle('dark-mode', hour >= 17 || hour < 9);
    }

    player1.style.left = `${player1Pos.x}px`;
    player1.style.top = `${player1Pos.y}px`;
    player2.style.left = `${player2Pos.x}px`;
    player2.style.top = `${player2Pos.y}px`;
    gameArea.style.width = `${initialGameAreaWidth}px`;
    gameArea.style.height = `${initialGameAreaHeight}px`;

    gameInterval = setInterval(() => {
        if (gameActive) {
            gameDuration += 0.1;
        }
    }, 100);

    applyTheme();
    setInterval(shrinkGameArea, 500);
    setInterval(moveBot, 100);
    setInterval(updateArrows, 50);
    setInterval(applyTheme, 60000);

    reloadButton.addEventListener('click', resetGame);
});