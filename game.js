const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;
const JUMP_POWER = -12; 
const SPEED = 5;

class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        
        // Your exact Figma measurements
        this.width = 22;  
        this.height = 32; 

        this.image = new Image();
        this.image.src = './assets/movement-no-bg.png'; // Updated file name

        this.frames = 0;       
        this.tickCount = 0;    
        this.state = 'idle';   

        // Map the coordinates
        this.sprites = {
            idle: { frames: [{ x: 0, y: 32 }] }, 
            run:  { frames: [
                { x: 0, y: 64 }, 
                { x: 22, y: 64 }, 
                { x: 44, y: 64 }
            ]}, 
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
            // The Canvas Flip Trick
            ctx.translate(this.position.x + this.width, this.position.y);
            ctx.scale(-1, 1);
            
            ctx.drawImage(
                this.image,
                sx, sy, this.width, this.height, 
                0, 0, this.width * 2, this.height * 2 
            );
        } else {
            // Normal Right-Facing Draw
            ctx.drawImage(
                this.image,
                sx, sy, this.width, this.height, 
                this.position.x, this.position.y, this.width * 2, this.height * 2 
            );
        }

        ctx.restore();
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        let previousState = this.state;

        // FIX: Use 'run' for both directions since draw() handles the flip
        if (this.velocity.y !== 0) {
            this.state = 'jump';
        } else if (this.velocity.x !== 0) { 
            this.state = 'run';
        } else {
            this.state = 'idle';
        }

        // Reset frame to 0 if we changed states
        if (this.state !== previousState) {
            this.frames = 0;
        }

        // Handle Animation Timing
        this.tickCount++;
        if (this.tickCount > 5) {
            this.frames++;
            this.tickCount = 0;
            
            // FIX: Loop the animation using array length
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