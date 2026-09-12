const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
        ctx.fillStyle = 'red'; 
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.draw();
        
        // We removed the canvas bottom check here! 
        // Gravity ALWAYS applies now.
        this.velocity.y += GRAVITY; 
    }
}

// NEW: Platform Class
class Platform {
    constructor(x, y, width, height) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

const player = new Player();
const keys = { right: false, left: false };

// Create some platforms
const platforms = [
    new Platform(0, canvas.height - 40, canvas.width, 40), // Main Ground
    new Platform(250, 300, 100, 20),                       // Floating block 1
    new Platform(450, 200, 150, 20)                        // Floating block 2
];

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all platforms first so they render behind the player
    platforms.forEach(platform => platform.draw());
    
    player.update();

    if (keys.right) {
        player.velocity.x = SPEED;
    } else if (keys.left) {
        player.velocity.x = -SPEED;
    } else {
        player.velocity.x = 0; 
    }

    // NEW: Collision Detection
    platforms.forEach(platform => {
        // Check if player is falling ONTO the platform
        if (
            player.position.y + player.height <= platform.position.y && // Bottom of player is above platform
            player.position.y + player.height + player.velocity.y >= platform.position.y && // Next frame will hit it
            player.position.x + player.width >= platform.position.x && // Right side of player is past left side of platform
            player.position.x <= platform.position.x + platform.width // Left side of player is past right side of platform
        ) {
            player.velocity.y = 0; // Stop falling
            // Snap exactly to the top so we don't sink in
            player.position.y = platform.position.y - player.height; 
        }
    });
}

window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyA': keys.left = true; break;
        case 'KeyD': keys.right = true; break;
        case 'KeyW': 
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

animate();