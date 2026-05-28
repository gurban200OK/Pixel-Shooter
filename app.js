const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game State Variables
let score = 0;
let health = 100;
let isGameOver = false;
let gameActive = false;
let gameMode = 'levels'; // 'levels' or 'endless'
let currentLevel = 1;
let spawnIntervalId = null;
let bossSpawned = false;

// Kills tracking for Level Mode progression
let levelKillsTarget = 10;
let levelKillsRemaining = 10;

// DOM Elements
const uiBar = document.getElementById('ui-bar');
const levelUi = document.getElementById('level-ui');
const enemyUi = document.getElementById('enemy-ui');

const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const enemyCountElement = document.getElementById('enemy-count');
const levelDisplay = document.getElementById('level-display');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverText = document.getElementById('game-over-text');
const finalScoreElement = document.getElementById('final-score');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

// Arrays
let bullets = [];
let enemyBullets = [];
let enemies = [];

const keys = { w: false, a: false, s: false, d: false };
const mouse = { x: 0, y: 0 };

window.addEventListener('keydown', (e) => {
    if (!gameActive || isGameOver) return;
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameActive || isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

window.addEventListener('click', () => {
    if (!gameActive || isGameOver) return;

    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const speed = 8;
    const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
    };
    bullets.push(new Bullet(player.x, player.y, 5, '#ffcc00', velocity));
});

// Player Class
class Player {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.angle = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, -5, this.radius + 10, 10);

        ctx.restore();
    }

    update() {
        if (keys.w && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.s && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.a && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.d && this.x + this.radius < canvas.width) this.x += this.speed;

        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// Enemy Class (Includes 3-Way split patterns for heavy shooters)
class Enemy {
    constructor(x, y, radius, color, speed, maxHealth, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.type = type; // 'normal', 'fast', 'shooter', 'heavy_shooter', 'boss'
        this.shootCooldown = 120;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw Health Bar
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - this.radius;
        const barY = this.y - this.radius - 8;

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercentage = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }

    update(targetX, targetY) {
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Shoot behaviors based on enemy types
        if (!isGameOver) {
            if (this.type === 'shooter') {
                this.shootCooldown--;
                if (this.shootCooldown <= 0) {
                    this.singleShoot();
                    this.shootCooldown = 120;
                }
            } else if (this.type === 'heavy_shooter') {
                this.shootCooldown--;
                if (this.shootCooldown <= 0) {
                    this.threeWayShoot();
                    this.shootCooldown = 150;
                }
            } else if (this.type === 'boss') {
                this.shootCooldown--;
                if (this.shootCooldown <= 0) {
                    this.bossShootPattern();
                    this.shootCooldown = 90;
                }
            }
        }
    }

    singleShoot() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const bSpeed = 4;
        const velocity = {
            x: Math.cos(angle) * bSpeed,
            y: Math.sin(angle) * bSpeed
        };
        enemyBullets.push(new Bullet(this.x, this.y, 4, '#9b59b6', velocity));
    }

    threeWayShoot() {
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const bSpeed = 4;
        const spread = 0.25; // Radial dispersion angle
        const angles = [baseAngle - spread, baseAngle, baseAngle + spread];

        angles.forEach(angle => {
            const velocity = {
                x: Math.cos(angle) * bSpeed,
                y: Math.sin(angle) * bSpeed
            };
            enemyBullets.push(new Bullet(this.x, this.y, 5, '#e74c3c', velocity));
        });
    }

    bossShootPattern() {
        // Attack Pattern: Circular expansion (8 bullets)
        const numBullets = 8;
        for (let i = 0; i < numBullets; i++) {
            const angle = (Math.PI * 2 / numBullets) * i;
            const bSpeed = 3;
            const velocity = {
                x: Math.cos(angle) * bSpeed,
                y: Math.sin(angle) * bSpeed
            };
            enemyBullets.push(new Bullet(this.x, this.y, 6, '#e67e22', velocity));
        }

        // Concentrated player target burst (3 bullets)
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const spread = 0.2;
        const angles = [baseAngle - spread, baseAngle, baseAngle + spread];
        angles.forEach(angle => {
            const velocity = {
                x: Math.cos(angle) * 5,
                y: Math.sin(angle) * 5
            };
            enemyBullets.push(new Bullet(this.x, this.y, 5, '#f1c40f', velocity));
        });
    }
}

// Generate enemies based on active Mode difficulty
function spawnEnemy() {
    if (!gameActive || isGameOver) return;
    if (gameMode === 'levels' && currentLevel === 4) return; // Only Boss spawns in level 4

    let radius = 15;
    let x, y;

    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    let speed = 1.5;
    let health = 1;
    let color = '#e74c3c';
    let type = 'normal';

    if (gameMode === 'levels') {
        if (currentLevel === 1) {
            type = 'normal';
            health = 1;
            color = '#e74c3c';
            speed = 1.5;
        } else if (currentLevel === 2) {
            type = 'fast';
            health = 3;
            color = '#e67e22';
            speed = 2.2;
        } else if (currentLevel === 3) {
            if (Math.random() < 0.4) {
                type = 'shooter';
                health = 2;
                color = '#9b59b6';
                speed = 1.1;
            } else {
                type = 'normal';
                health = 2;
                color = '#e74c3c';
                speed = 1.7;
            }
        }
    } else {
        // Endless Mode progressive scaling
        if (score < 100) {
            // Stage 1
            type = 'normal';
            health = 1;
            color = '#e74c3c';
            speed = 1.5;
        } else if (score >= 100 && score < 200) {
            // Stage 2: Fast & double HP
            type = 'fast';
            health = 2;
            color = '#e67e22';
            speed = 2.3;
        } else if (score >= 200 && score < 300) {
            // Stage 3: Purple Shooters
            if (Math.random() < 0.4) {
                type = 'shooter';
                health = 2;
                color = '#9b59b6';
                speed = 1.5;
            } else {
                type = 'normal';
                health = 2;
                color = '#e74c3c';
                speed = 2.0;
            }
        } else {
            // Stage 4: Heavy shooter split shooters (300+ score)
            if (Math.random() < 0.35) {
                type = 'heavy_shooter';
                radius = 22; // Larger size
                health = 4;
                color = '#2c3e50';
                speed = 1.0;
            } else {
                type = 'normal';
                health = 3;
                color = '#e74c3c';
                speed = 2.2;
            }
        }
    }

    enemies.push(new Enemy(x, y, radius, color, speed, health, type));
}

// Spawn Level 4 Boss
function spawnBoss() {
    bossSpawned = true;
    const boss = new Enemy(canvas.width / 2, 80, 45, '#8e44ad', 0.3, 50, 'boss');
    enemies.push(boss);
    enemyCountElement.textContent = "BOSS";
}

function getDistance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

const player = new Player(canvas.width / 2, canvas.height / 2, 20, '#3498db', 4);

// Start game action
function startGame() {
    const selectedRadio = document.querySelector('input[name="gameMode"]:checked');
    gameMode = selectedRadio ? selectedRadio.value : 'levels';

    startScreen.classList.add('hidden');
    uiBar.classList.remove('hidden');

    // UI adaptation based on selected Game Mode
    if (gameMode === 'levels') {
        levelUi.classList.remove('hidden');
        enemyUi.classList.remove('hidden');
    } else {
        levelUi.classList.add('hidden');
        enemyUi.classList.add('hidden');
    }

    gameActive = true;
    initGame();
}

// Initialize session parameters
function initGame() {
    score = 0;
    health = 100;
    currentLevel = 1;
    isGameOver = false;
    gameActive = true;
    bossSpawned = false;
    bullets = [];
    enemyBullets = [];
    enemies = [];

    // Reset kill metrics for level 1
    levelKillsTarget = 10;
    levelKillsRemaining = 10;

    scoreElement.textContent = score;
    healthElement.textContent = health;
    
    if (gameMode === 'levels') {
        levelDisplay.textContent = '1';
        enemyCountElement.textContent = levelKillsRemaining;
    }

    // Reset Overlay Displays
    gameOverTitle.textContent = "GAME OVER";
    gameOverTitle.style.color = "#e74c3c";
    gameOverText.innerHTML = 'Your Final Score: <span id="final-score">0</span>';
    gameOverScreen.classList.add('hidden');

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(spawnEnemy, 2000);

    gameLoop();
}

// Return to Main Menu
function showMainMenu() {
    isGameOver = false;
    gameActive = false;
    if (spawnIntervalId) clearInterval(spawnIntervalId);

    // Swap Overlays back to Home
    gameOverScreen.classList.add('hidden');
    uiBar.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// Trigger Victory layout
function triggerVictory() {
    isGameOver = true;
    gameActive = false;
    clearInterval(spawnIntervalId);

    gameOverTitle.textContent = "VICTORY!";
    gameOverTitle.style.color = "#2ecc71";
    document.getElementById('final-score').textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Trigger Game Over layout
function triggerGameOver() {
    isGameOver = true;
    gameActive = false;
    clearInterval(spawnIntervalId);

    gameOverTitle.textContent = "GAME OVER";
    gameOverTitle.style.color = "#e74c3c";
    document.getElementById('final-score').textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Səviyyə Keçidləri (Kill Targets)
function handleEnemyKill(enemy) {
    if (enemy.type === 'boss') {
        score += 500;
        triggerVictory();
        return;
    }

    score += 10;
    scoreElement.textContent = score;

    if (gameMode === 'levels') {
        if (currentLevel < 4) {
            levelKillsRemaining--;
            
            if (levelKillsRemaining <= 0) {
                // Səviyyəni artırırıq
                currentLevel++;
                enemies = []; // Yeni levelə keçəndə ekranı təmizləyirik
                
                if (currentLevel === 2) {
                    levelKillsRemaining = 15;
                    levelDisplay.textContent = '2';
                } else if (currentLevel === 3) {
                    levelKillsRemaining = 20;
                    levelDisplay.textContent = '3';
                } else if (currentLevel === 4) {
                    levelKillsRemaining = 1; // Boss
                    levelDisplay.textContent = '4 (BOSS)';
                    spawnBoss();
                }
            }
            
            // UI-ı yeniləyirik
            if (currentLevel < 4) {
                enemyCountElement.textContent = levelKillsRemaining;
            }
        }
    }
}

// Main Game Loop
function gameLoop() {
    if (!gameActive || isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    // 1. Update Player Bullets
    bullets.forEach((bullet, bIndex) => {
        bullet.update();
        bullet.draw();

        if (
            bullet.x + bullet.radius < 0 ||
            bullet.x - bullet.radius > canvas.width ||
            bullet.y + bullet.radius < 0 ||
            bullet.y - bullet.radius > canvas.height
        ) {
            bullets.splice(bIndex, 1);
        }
    });

    // 2. Update Enemy Projectiles
    enemyBullets.forEach((eBullet, ebIndex) => {
        eBullet.update();
        eBullet.draw();

        // Contact check: Enemy Projectiles vs Player
        const distToPlayer = getDistance(player.x, player.y, eBullet.x, eBullet.y);
        if (distToPlayer - player.radius - eBullet.radius < 1) {
            health -= 10;
            healthElement.textContent = Math.max(0, health);
            enemyBullets.splice(ebIndex, 1);

            if (health <= 0) {
                triggerGameOver();
            }
        }

        // Clear out of bounds bullets
        if (
            eBullet.x + eBullet.radius < 0 ||
            eBullet.x - eBullet.radius > canvas.width ||
            eBullet.y + eBullet.radius < 0 ||
            eBullet.y - eBullet.radius > canvas.height
        ) {
            enemyBullets.splice(ebIndex, 1);
        }
    });

    // 3. Update Enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.update(player.x, player.y);
        enemy.draw();

        // Contact check: Enemy body vs Player body
        const distToPlayer = getDistance(player.x, player.y, enemy.x, enemy.y);
        if (distToPlayer - player.radius - enemy.radius < 1) {
            let damage = enemy.type === 'boss' ? 50 : 20;
            health -= damage;
            healthElement.textContent = Math.max(0, health);
            
            if (enemy.type !== 'boss') {
                enemies.splice(eIndex, 1);
            }

            if (health <= 0) {
                triggerGameOver();
            }
        }

        // Contact check: Player Bullets vs Enemy body
        bullets.forEach((bullet, bIndex) => {
            const distToBullet = getDistance(bullet.x, bullet.y, enemy.x, enemy.y);
            
            if (distToBullet - bullet.radius - enemy.radius < 1) {
                bullets.splice(bIndex, 1);
                enemy.health -= 1; // 1 DMG per standard hit

                if (enemy.health <= 0) {
                    setTimeout(() => {
                        enemies.splice(eIndex, 1);
                        handleEnemyKill(enemy); // Handle Level progress or score
                    }, 0);
                }
            }
        });
    });

    requestAnimationFrame(gameLoop);
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', initGame);
menuBtn.addEventListener('click', showMainMenu);