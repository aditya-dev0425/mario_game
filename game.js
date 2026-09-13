const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;
const JUMP_POWER = -12; 
const SPEED = 5;

class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        
        // Exact math based on your 165x240 image (4 cols, 4 rows)
        this.width = 41.25;  
        this.height = 60;    

        this.image = new Image();
        this.image.src = './assets/images/movement-no-bg.png'; 

        this.frames = 0;       
        this.tickCount = 0;    
        this.state = 'idle';   

        // Map the coordinates using the true 60px row heights and 41.25px column widths
        this.sprites = {
            // Idle: Row 2, Column 1
            idle: { frames: [{ x: 0, y: 60 }] }, 
            
            // Run: Row 3, Columns 1, 2, 3
            run:  { frames: [
                { x: 0, y: 120 }, 
                { x: 41.25, y: 120 }, 
                { x: 82.5, y: 120 }
            ]}, 
            
            // Jump: Row 1, Column 1
            jump: { frames: [{ x: 0, y: 0 }] } 
        };
    }

    draw() {
        const currentAnimation = this.sprites[this.state];
        
        // Fallback to frame 0 if the current frame exceeds the available frames in a new state
        if (this.frames >= currentAnimation.frames.length) {
            this.frames = 0;
        }

        const sx = currentAnimation.frames[this.frames].x;
        const sy = currentAnimation.frames[this.frames].y;

        ctx.save();

        if (keys.left) {
            // The Canvas Flip Trick for running left
            ctx.translate(this.position.x + this.width, this.position.y);
            ctx.scale(-1, 1);
            
            // Draw without the * 2 multiplier since 60px is already a good height
            ctx.drawImage(
                this.image,
                sx, sy, this.width, this.height, 
                0, 0, this.width, this.height 
            );
        } else {
            // Normal Right-Facing Draw
            ctx.drawImage(
                this.image,
                sx, sy, this.width, this.height, 
                this.position.x, this.position.y, this.width, this.height 
            );
        }

        ctx.restore();
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        let previousState = this.state;

        if (this.velocity.y !== 0) {
            this.state = 'jump';
        } else if (this.velocity.x !== 0) { 
            this.state = 'run';
        } else {
            this.state = 'idle';
        }

        if (this.state !== previousState) {
            this.frames = 0;
        }

        // Handle Animation Timing
        this.tickCount++;
        if (this.tickCount > 5) {
            this.frames++;
            this.tickCount = 0;
            
            if (this.frames >= this.sprites[this.state].frames.length) {
                this.frames = 0;
            }
        }

        this.draw();
        this.velocity.y += GRAVITY; 
    }
} // <--- FIX: The closing bracket for the Player class was moved here!

// Platform Class
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

   // Full Directional Collision Detection
    platforms.forEach(platform => {
        // First, check if the player is lined up horizontally with the platform
        const isHorizontallyAligned = 
            player.position.x + player.width >= platform.position.x &&
            player.position.x <= platform.position.x + platform.width;

        if (isHorizontallyAligned) {
            
            // 1. Landing on TOP of the platform (Moving Down)
            if (
                player.position.y + player.height - player.velocity.y <= platform.position.y && 
                player.position.y + player.height >= platform.position.y
            ) {
                player.velocity.y = 0; 
                player.position.y = platform.position.y - player.height; 
            }
            
            // 2. Bumping HEAD on the BOTTOM of the platform (Moving Up)
            else if (
                player.position.y - player.velocity.y >= platform.position.y + platform.height && 
                player.position.y <= platform.position.y + platform.height
            ) {
                player.velocity.y = 0; // Kill upward momentum
                player.position.y = platform.position.y + platform.height; // Snap just below the block
            }
        }
    });
}

window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyA': keys.left = true; break;
        case 'KeyD': keys.right = true; break;
        case 'Space': 
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