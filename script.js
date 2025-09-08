document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('gameArea');
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    const winSound = document.getElementById('winSound');
    const gameOverMenu = document.getElementById('gameOverMenu');
    const gameDurationElem = document.getElementById('gameDuration');
    const player1HealthElem = document.getElementById('player1Health');
    const player2HealthElem = document.getElementById('player2Health');
    const reloadButton = document.getElementById('reloadButton');

    let player1Pos = { x: 100, y: 100 };
    let player2Pos = { x: 200, y: 200 };
    let player1HP = 100;
    let player2HP = 100;
    const speed = 5;
    const arrowSpeed = 10;
    const arrows = [];
    let gameDuration = 0;
    let gameInterval;
    let gameActive = true;

    class Arrow {
        constructor(x, y, direction, color) {
            this.x = x;
            this.y = y;
            this.direction = direction;
            this.color = color;
            this.element = document.createElement('div');
            this.element.className = 'arrow';
            this.element.style.backgroundColor = color;
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
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        }
    }

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

        switch (key) {
            case 'ArrowUp':
                if (pos.y - speed >= 0) pos.y -= speed;
                break;
            case 'ArrowDown':
                if (pos.y + speed <= gameArea.clientHeight - player.clientHeight) pos.y += speed;
                break;
            case 'ArrowLeft':
                if (pos.x - speed >= 0) pos.x -= speed;
                break;
            case 'ArrowRight':
                if (pos.x + speed <= gameArea.clientWidth - player.clientWidth) pos.x += speed;
                break;
        }

        if (checkPlayerCollision(pos, otherPos)) {
            pos.x = oldPos.x;
            pos.y = oldPos.y;
            return;
        }

        player.style.left = `${Math.max(0, Math.min(pos.x, gameArea.clientWidth - player.clientWidth))}px`;
        player.style.top = `${Math.max(0, Math.min(pos.y, gameArea.clientHeight - player.clientHeight))}px`;
    }

    function shootArrow(player, pos, color) {
        const arrowLeft = new Arrow(pos.x + 10, pos.y + 10, 'left', color);
        const arrowRight = new Arrow(pos.x + 10, pos.y + 10, 'right', color);
        arrows.push(arrowLeft, arrowRight);
    }

    function checkCollision() {
        arrows.forEach((arrow, index) => {
            if (arrow.checkCollision(player1)) {
                player1HP = Math.max(0, player1HP - 10); // Prevent negative health
                console.log(`Player 1 HP: ${player1HP}`);
                arrow.element.remove();
                arrows.splice(index, 1);
                if (player1HP <= 0) {
                    winSound.play();
                    endGame("Player 2 wins!");
                }
            } else if (arrow.checkCollision(player2)) {
                player2HP = Math.max(0, player2HP - 10); // Prevent negative health
                console.log(`Player 2 HP: ${player2HP}`);
                arrow.element.remove();
                arrows.splice(index, 1);
                if (player2HP <= 0) {
                    winSound.play();
                    endGame("You win!");
                }
            }
        });
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
        document.getElementById('winnerMessage').innerText = '';
    }

    function endGame(resultMessage) {
        const winnerMessageElem = document.getElementById('winnerMessage');
        winnerMessageElem.innerText = resultMessage;

        gameDurationElem.innerText = `Duration: ${gameDuration.toFixed(2)} seconds`;
        player1HealthElem.innerText = `Player 1 Health: ${player1HP}`;
        player2HealthElem.innerText = `Player 2 Health: ${player2HP}`;

        gameOverMenu.style.display = 'block';
        gameActive = false;
        console.log(resultMessage);
    }

    document.addEventListener('keydown', (e) => {
        movePlayer(player1, player1Pos, e.key, player2Pos);
        if (e.key === ' ') {
            shootArrow(player1, player1Pos, 'blue');
        }
        checkCollision();
    });

    function moveBot() {
        if (!gameActive) return;

        const dx = player1Pos.x - player2Pos.x;
        const dy = player1Pos.y - player2Pos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            movePlayer(player2, player2Pos, dx > 0 ? 'ArrowRight' : 'ArrowLeft', player1Pos);
        } else {
            movePlayer(player2, player2Pos, dy > 0 ? 'ArrowDown' : 'ArrowUp', player1Pos);
        }

        if (Math.random() < 0.1) {
            shootArrow(player2, player2Pos, 'green');
        }
        checkCollision();
    }

    function shrinkGameArea() {
        const currentWidth = gameArea.clientWidth;
        const currentHeight = gameArea.clientHeight;
        gameArea.style.width = `${Math.max(0, currentWidth - 2)}px`; // prevent negative width
        gameArea.style.height = `${Math.max(0, currentHeight - 2)}px`; // prevent negative height
    }


    function updateArrows() {
        arrows.forEach((arrow, index) => {
            arrow.move();
            if (
                arrow.x < 0 ||
                arrow.x > gameArea.clientWidth ||
                arrow.y < 0 ||
                arrow.y > gameArea.clientHeight
            ) {
                arrow.element.remove();
                arrows.splice(index, 1);
            }
        });
    }

    function applyTheme() {
        const hour = new Date().getHours();
        document.body.classList.toggle('dark-mode', hour >= 17 || hour < 9);
    }

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