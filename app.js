const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Object to track pressed keys
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Mouse coordinates
const mouse = {
    x: 0,
    y: 0
};

// Event listener for key presses
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

// Event listener for key releases
window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

// Update mouse coordinates relative to the canvas
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
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

        // Draw Player Body (Circle)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw Player Gun (Direction indicator)
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, -5, this.radius + 10, 10);

        ctx.restore();
    }

    update() {
        // Player movement logic (WASD) with boundary check
        if (keys.w && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.s && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.a && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.d && this.x + this.radius < canvas.width) this.x += this.speed;

        // Calculate rotation angle towards the mouse
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    }
}

// Instantiate the Player
const player = new Player(canvas.width / 2, canvas.height / 2, 20, '#3498db', 4);

// Main Game Loop
function gameLoop() {
    // Clear canvas every frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw Player
    player.update();
    player.draw();

    // Loop again
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();