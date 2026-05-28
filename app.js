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

// DOM Elements
const uiBar = document.getElementById('ui-bar');
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

// Arrays for entities
let bullets = [];         // Player bullets
let enemyBullets = [];    // Enemy/Boss bullets
let enemies = [];         // Active enemies

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

// Bullet Class (Used for both Player and Enemies)
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

// Enemy Class
class Enemy {
    constructor(x, y, radius, color, speed, maxHealth, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.type = type; // 'normal', 'fast', 'shooter', 'boss'
        this.shootCooldown = 120; // 2 seconds for shooters
    }

    draw() {
        // Draw Enemy Body
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

        // Red background bar
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Green current health bar
        const healthPercentage = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }

    update(targetX, targetY) {
        // Move towards target
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Shooter AI: Shoot at player periodically
        if (this.type === 'shooter' && !isGameOver) {
            this.shootCooldown--;
            if (this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = 120; // Reset
            }
        }

        // Boss Attack Patterns
        if (this.type === 'boss' && !isGameOver) {
            this.shootCooldown--;
            if (this.shootCooldown <= 0) {
                this.bossShoot();
                this.shootCooldown = 90; // Attack every 1.5 seconds
            }
        }
    }

    shoot() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const bSpeed = 4;
        const velocity = {
            x: Math.cos(angle) * bSpeed,
            y: Math.sin(angle) * bSpeed
        };
        enemyBullets.push(new Bullet(this.x, this.y, 4, '#9b59b6', velocity));
    }

    bossShoot() {
        // Attack Pattern: 8-Way Circle Shot
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

        // Additional spiral spray randomly
        if (Math.random() < 0.5) {
            const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
            const spread = 0.3; // Angle spread
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
}

// Function to spawn enemies based on Level or Endless Mode scaling
function spawnEnemy() {
    if (!gameActive || isGameOver) return;

    // In levels mode, stop normal spawning if Level 4 Boss is active
    if (gameMode === 'levels' && currentLevel === 4) return;

    let radius = 15;
    let x, y;

    // Pick outside screen position
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
            // Level 1: Normal enemies
            type = 'normal';
            health = 1;
            color = '#e74c3c';
            speed = 1.5;
        } else if (currentLevel === 2) {
            // Level 2: Fast & Tank enemies
            type = 'fast';
            health = 3;
            color = '#e67e22';
            speed = 2.2;
        } else if (currentLevel === 3) {
            // Level 3: Shooter enemies
            if (Math.random() < 0.4) {
                type = 'shooter';
                health = 2;
                color = '#9b59b6';
                speed = 1.0;
            } else {
                type = 'normal';
                health = 2;
                color = '#e74c3c';
                speed = 1.7;
            }
        }
    } else {
        // Endless Mode: Scale difficulty progressively based on score
        const scoreFactor = Math.floor(score / 150);
        speed = 1.5 + (scoreFactor * 0.2);
        health = 1 + Math.floor(scoreFactor * 0.5);
        color = `rgb(${Math.min(255, 150 + scoreFactor * 20)}, 50, 50)`;
        
        // Spawn shooters in endless mode after 200 points
        if (score >= 200 && Math.random() < 0.25) {
            type = 'shooter';
            color = '#9b59b6';
            speed = 1.2;
        }
    }

    enemies.push(new Enemy(x, y, radius, color, speed, health, type));
    enemyCountElement.textContent = enemies.length;
}

// Spawn Boss at Level 4
function spawnBoss() {
    bossSpawned = true;
    const boss = new Enemy(canvas.width / 2, 80, 45, '#8e44ad', 0.3, 50, 'boss');
    enemies.push(boss);
    enemyCountElement.textContent = enemies.length;
}

function getDistance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

const player = new Player(canvas.width / 2, canvas.height / 2, 20, '#3498db', 4);

// Start Game Setup
function startGame() {
    const selectedRadio = document.querySelector('input[name="gameMode"]:checked');
    gameMode = selectedRadio ? selectedRadio.value : 'levels';

    startScreen.classList.add('hidden');
    uiBar.classList.remove('hidden');

    gameActive = true;
    initGame();
}

// Reset Game state without page refresh
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

    scoreElement.textContent = score;
    healthElement.textContent = health;
    enemyCountElement.textContent = 0;
    levelDisplay.textContent = gameMode === 'levels' ? '1' : 'Endless';

    // Reset overlay layout defaults
    gameOverTitle.textContent = "GAME OVER";
    gameOverTitle.className = "over-title";
    gameOverText.innerHTML = 'Your Final Score: <span id="final-score">0</span>';
    gameOverScreen.classList.add('hidden');

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(spawnEnemy, 2000);

    gameLoop();
}

// Handle Victory state
function triggerVictory() {
    isGameOver = true;
    gameActive = false;
    clearInterval(spawnIntervalId);

    // Turn screen overlay green for victory
    gameOverTitle.textContent = "VICTORY!";
    gameOverTitle.className = "over-title victory-title"; // We can style this or use inline
    gameOverTitle.style.color = "#2ecc71";
    
    document.getElementById('final-score').textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Handle Game Over state
function triggerGameOver() {
    isGameOver = true;
    gameActive = false;
    clearInterval(spawnIntervalId);

    gameOverTitle.style.color = "#e74c3c";
    document.getElementById('final-score').textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Level Progression Manager
function checkLevelProgression() {
    if (gameMode !== 'levels') return;

    if (score >= 100 && currentLevel === 1) {
        currentLevel = 2;
        levelDisplay.textContent = currentLevel;
        enemies = []; // Clear current wave as a reward
    } else if (score >= 250 && currentLevel === 2) {
        currentLevel = 3;
        levelDisplay.textContent = currentLevel;
        enemies = [];
    } else if (score >= 450 && currentLevel === 3) {
        currentLevel = 4;
        levelDisplay.textContent = "4 (BOSS)";
        enemies = [];
        spawnBoss();
    }
}

// Main Game Loop
function gameLoop() {
    if (!gameActive || isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    // Check level progression targets
    checkLevelProgression();

    // 1. Update and Draw Player Bullets
    bullets.forEach((bullet, bIndex) => {
        bullet.update();
        bullet.draw();

        // Clear out of boundary bullets
        if (
            bullet.x + bullet.radius < 0 ||
            bullet.x - bullet.radius > canvas.width ||
            bullet.y + bullet.radius < 0 ||
            bullet.y - bullet.radius > canvas.height
        ) {
            bullets.splice(bIndex, 1);
        }
    });

    // 2. Update and Draw Enemy Bullets
    enemyBullets.forEach((eBullet, ebIndex) => {
        eBullet.update();
        eBullet.draw();

        // Check collision: Enemy Bullet vs Player
        const distToPlayer = getDistance(player.x, player.y, eBullet.x, eBullet.y);
        if (distToPlayer - player.radius - eBullet.radius < 1) {
            health -= 10; // Shooters deal 10 dmg
            healthElement.textContent = Math.max(0, health);
            enemyBullets.splice(ebIndex, 1);

            if (health <= 0) {
                triggerGameOver();
            }
        }

        // Clear offscreen enemy bullets
        if (
            eBullet.x + eBullet.radius < 0 ||
            eBullet.x - eBullet.radius > canvas.width ||
            eBullet.y + eBullet.radius < 0 ||
            eBullet.y - eBullet.radius > canvas.height
        ) {
            enemyBullets.splice(ebIndex, 1);
        }
    });

    // 3. Update and Draw Enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.update(player.x, player.y);
        enemy.draw();

        // Check Collision: Enemy body vs Player body
        const distToPlayer = getDistance(player.x, player.y, enemy.x, enemy.y);
        if (distToPlayer - player.radius - enemy.radius < 1) {
            let damage = enemy.type === 'boss' ? 50 : 20;
            health -= damage;
            healthElement.textContent = Math.max(0, health);
            
            // Only remove non-boss enemies on contact
            if (enemy.type !== 'boss') {
                enemies.splice(eIndex, 1);
            }
            enemyCountElement.textContent = enemies.length;

            if (health <= 0) {
                triggerGameOver();
            }
        }

        // Check Collision: Player Bullets vs Enemy body
        bullets.forEach((bullet, bIndex) => {
            const distToBullet = getDistance(bullet.x, bullet.y, enemy.x, enemy.y);
            
            if (distToBullet - bullet.radius - enemy.radius < 1) {
                // Remove bullet instantly
                bullets.splice(bIndex, 1);

                // Decrease Enemy Health
                enemy.health -= 1; // Basic bullets deal 1 dmg

                // If enemy dies
                if (enemy.health <= 0) {
                    setTimeout(() => {
                        enemies.splice(eIndex, 1);
                        
                        if (enemy.type === 'boss') {
                            score += 500;
                            triggerVictory();
                        } else {
                            score += 10;
                        }

                        scoreElement.textContent = score;
                        enemyCountElement.textContent = enemies.length;
                    }, 0);
                }
            }
        });
    });

    requestAnimationFrame(gameLoop);
}

// Event Listeners for buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', initGame);