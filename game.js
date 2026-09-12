const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.5;
const JUMP_POWER = -10;
const SPEED = 5;

class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        this.width = 30;
        this.height = 30;
    }

    draw() {
        ctx.fillStyle = 'red'; // Placeholder for our sprite
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        // 1. Apply velocity to position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        this.draw();

        // 2. Apply gravity if we aren't at the bottom of the screen
        // In a real game, this will check for ground/platforms, not the canvas bottom.
        if (this.position.y + this.height + this.velocity.y <= canvas.height) {
            this.velocity.y += GRAVITY; 
        } else {
            this.velocity.y = 0; // Hit the ground, stop falling
        }
    }
}

const player = new Player();
const keys = { right: false, left: false };

// The main game loop
function animate() {
    requestAnimationFrame(animate);
    
    // Clear the canvas every frame before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    player.update();

    // Horizontal movement logic
    if (keys.right) {
        player.velocity.x = SPEED;
    } else if (keys.left) {
        player.velocity.x = -SPEED;
    } else {
        player.velocity.x = 0; // Stop moving if no key is pressed
    }
}

// Event Listeners for controls
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyA': keys.left = true; break;
        case 'KeyD': keys.right = true; break;
        case 'KeyW': 
            // Only allow jumping if we are touching the ground (velocity.y === 0)
            if (player.velocity.y === 0) player.velocity.y = JUMP_POWER; 
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyA': keys.left = false; break;
        case 'KeyD': keys.right = false; break;
    }
});

animate(); // Start the loop