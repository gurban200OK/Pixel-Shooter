const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const mouse = {
    x: 0,
    y: 0
};

// Arrays to hold active bullets and enemies
const bullets = [];
const enemies = [];

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// Shoot a bullet when player clicks
window.addEventListener('click', () => {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const speed = 8;
    const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
    };
    
    // Spawn bullet at player's position
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

// Enemy Class
class Enemy {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update(targetX, targetY) {
        // Move towards the player
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

// Function to spawn enemies from outside the screen
function spawnEnemy() {
    const radius = 15;
    let x, y;

    // Decide a random side of the screen to spawn from (Top, Bottom, Left, Right)
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const speed = 1.5;
    enemies.push(new Enemy(x, y, radius, '#e74c3c', speed));
}

// Spawn an enemy every 2 seconds (2000 milliseconds)
setInterval(spawnEnemy, 2000);

// Helper function to calculate distance between two circle entities
function getDistance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

const player = new Player(canvas.width / 2, canvas.height / 2, 20, '#3498db', 4);

// Main Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw Player
    player.update();
    player.draw();

    // Update and draw Bullets
    bullets.forEach((bullet, bIndex) => {
        bullet.update();
        bullet.draw();

        // Remove bullet if it goes off screen to save memory
        if (
            bullet.x + bullet.radius < 0 ||
            bullet.x - bullet.radius > canvas.width ||
            bullet.y + bullet.radius < 0 ||
            bullet.y - bullet.radius > canvas.height
        ) {
            bullets.splice(bIndex, 1);
        }
    });

    // Update and draw Enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.update(player.x, player.y);
        enemy.draw();

        // Check collision between Enemy and Player
        const distToPlayer = getDistance(player.x, player.y, enemy.x, enemy.y);
        if (distToPlayer - player.radius - enemy.radius < 1) {
            console.log("Player Hit!"); // Placeholder for game over / lose life logic
        }

        // Check collision between Bullets and Enemies
        bullets.forEach((bullet, bIndex) => {
            const distToBullet = getDistance(bullet.x, bullet.y, enemy.x, enemy.y);
            
            // If bullet hits enemy, remove both
            if (distToBullet - bullet.radius - enemy.radius < 1) {
                // Using setTimeout to prevent visual glitching during array splice
                setTimeout(() => {
                    enemies.splice(eIndex, 1);
                    bullets.splice(bIndex, 1);
                }, 0);
            }
        });
    });

    requestAnimationFrame(gameLoop);
}

gameLoop();