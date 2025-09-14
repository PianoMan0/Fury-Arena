document.addEventListener('DOMContentLoaded', () => {

    const gameArea = document.getElementById('gameArea');

    // Player 1 and Player 2 Elements
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');

    // Win Sound and Game Over Menu Elements
    const winSound = new Audio();
    winSound.src = 'win.mp3';
    const gameOverMenu = document.getElementById('gameOverMenu');

    // Health and Win Streak Elements
    const player1HealthElem = document.getElementById('player1Health');
    const player2HealthElem = document.getElementById('player2Health');
    const winStreakElem = document.getElementById('winStreak');
    const coinsEarnedElem = document.getElementById('coinsEarned');

    // Shop and Game Area Display
    let shopAreaDisplay = false;
    let gameAreaDisplay = true;

    function updateShopButton() {
        if (currentUser) {
            shopButton.style.display = '';
            shopButton.innerText = `Shop (${coins} coins)`;
        }
    }

    const shopButton = document.getElementById('shopButton');
    const goToShopButton = document.getElementById('goToShopButton');
    const backToGameButton = document.getElementById('backToGameButton');

    function showShop() {
        shopAreaDisplay = true;
        gameAreaDisplay = false;

        coinsDisplay.innerText = `Coins: ${coins}`;

        renderSkinsList();
    }

    // Shop List Functionality
    let skinsListHtml = '';
    const skinsList = document.getElementById('skinsList');

    function renderSkinsList() {
        skinsList.innerHTML = '';
        AVAILABLE_SKINS.forEach(skin => {
            const div = document.createElement('div');
            div.className = 'shop-skin';
            div.style.backgroundColor = skin.color;
            div.title = `${skin.name} (${skin.cost} coins)`;
            if (ownedSkins.includes(skin.name)) {
                div.classList.add('owned');
            }
            if (selectedSkin === skin.name) {
                div.classList.add('selected');
            }

            // Event Listener for Skin Selection
            div.onclick = () => {
                if (ownedSkins.includes(skin.name)) {
                    fetch('user.php', {
                        method: 'POST',
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: `username=${encodeURIComponent(currentUser)}&action=select_skin&skin=${encodeURIComponent(skin.name)}`
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            selectedSkin = skin.name;
                            applySelectedSkin();
                            renderSkinsList();
                        }
                    });
                } else if (coins >= skin.cost) {
                    fetch('user.php', {
                        method: 'POST',
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: `username=${encodeURIComponent(currentUser)}&action=buy_skin&skin=${encodeURIComponent(skin.name)}&cost=${skin.cost}`
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            ownedSkins.push(skin.name);
                            coins -= skin.cost;
                            coinsDisplay.innerText = `Coins: ${coins}`;
                            renderSkinsList();
                        } else {
                            alert(data.message);
                        }
                    });
                } else {
                    alert("Not enough coins!");
                }
            };

            div.innerHTML = `<span style="color:#fff;font-size:12px;position:absolute;bottom:2px;left:2px;">${skin.name}</span>`;
            skinsList.appendChild(div);
        });
    }

    // Shop Button Event Listeners
    shopButton.addEventListener('click', () => {
        showShop();
    });

    goToShopButton.addEventListener('click', () => {
        gameOverMenu.style.display = 'none';
        showShop();
    });

    backToGameButton.addEventListener('click', () => {
        shopAreaDisplay = false;
        gameAreaDisplay = true;

        updateShopButton();

        renderSkinsList();
    });

    // Player Movement and Game Loop
    let player1Pos = { x: 100, y: 100 };
    let player2Pos = { x: 200, y: 200 };

function moveBot() {
    if (!gameActive) return;
    const dx = player2Pos.x - player1Pos.x;
    const dy = player2Pos.y - player1Pos.y;
    let botDirection = determineNextDirection(dx, dy);
    movePlayer(player2, player2Pos, botDirection, player1Pos);
    let newBotDirection = botDirection;
    if (Math.random() < 0.1) {
        shootArrow('player2', player2Pos, 'green', newBotDirection, 'player2');
    }
}

function determineNextDirection(dx, dy) {
    // Update the direction every 10 frames
    if (Math.random() < 0.1) {
        const directions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        return directions[Math.floor(Math.random() * 4)];
    } else if (Math.abs(dx) > Math.abs(dy)) {
        // Update the direction based on x and y velocities
        return dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    } else {
        // Update the direction based on y and x velocities
        return dy > 0 ? 'ArrowDown' : 'ArrowUp';
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
        let arrows = arrows ? arrows : [];
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

    // Game Loop and Updates
    let gameActive = true;
    let gameInterval;

    function updateGame() {
        if (gameActive) {
            gameDuration += 0.1;
        }

        clearInterval(gameInterval);

        gameInterval = setInterval(() => {
            updateGame();
        }, 100);
    }

    // Event Listeners for Game Area and Player
    document.getElementById('player1').addEventListener('click', () => {
        shootArrow(player1, player1Pos, getSkinColor(selectedSkin), lastBotDirection, 'player1');
    });

    function checkCollision() {
        let arrows = arrows ? arrows : [];
        for (let i = arrows.length - 1; i >= 0; i--) {
            const arrow = arrows[i];
            if (arrow.owner === 'player2' && arrow.checkCollision(player1)) {
                player1HP = Math.max(0, player1HP - 10);
                arrow.element.remove();
                arrows.splice(i, 1);

                if (player1HP <= 0) {
                    winSound.play();
                    endGame(`${player1Name} loses!`, false);
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

    function applyTheme() {
        const hour = new Date().getHours();

        document.body.classList.toggle('dark-mode', hour >= 17 || hour < 9);
    }

    // Theme Update and Game Loop
    setInterval(updateArrows, 50);

    function endGame(resultMessage, playerWon) {
        winnerMessageElem.innerText = resultMessage;
        gameDurationElem.innerText = `Duration: ${gameDuration.toFixed(2)} seconds`;
        player1HealthElem.innerText = `${player1Name}'s Health: ${player1HP}`;
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
            coinsEarnedElem.innerText = `Coins earned: ${data.coins_earned || 0}`;

            coins = data.coins || coins;
        })
        .catch(() => {
            winStreakElem.innerText = "Win streak unavailable.";
            coinsEarnedElem.innerText = "";
        });
    }

    function applySelectedSkin() {
        player1.style.backgroundColor = getSkinColor(selectedSkin);
    }

    function getSkinColor(skinName) {
        const found = AVAILABLE_SKINS.find(s => s.name === skinName);
        return found ? found.color : 'blue';
    }
});
