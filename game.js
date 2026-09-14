// ==========================================
// SETUP & CONSTANTS
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;
const JUMP_POWER = -12; 
const SPEED = 5;

// Global Game States
let lives = 3;
let isGameOver = false;
let isGameWon = false;

let player;
let platforms = [];
let goal; 
let scrollOffset = 0;
const keys = { right: false, left: false };

// ==========================================
// CLASSES
// ==========================================
class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        
        // Exact math based on your 165x240 image (4 columns, 4 rows)
        this.width = 41.25;  
        this.height = 60;    

        this.image = new Image();
        this.image.src = './assets/images/movement-no-bg.png'; 

        // Animation control variables
        this.frames = 0;       
        this.tickCount = 0;    
        this.state = 'idle';   

        // Coordinate map for the sprite sheet
        this.sprites = {
            idle: { frames: [{ x: 0, y: 60 }] }, 
            run:  { frames: [
                { x: 0, y: 120 }, 
                { x: 41.25, y: 120 }, 
                { x: 82.5, y: 120 }
            ]}, 
            jump: { frames: [{ x: 0, y: 0 }] } 
        };
    }

    draw() {
        const currentAnimation = this.sprites[this.state];
        
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
}

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

class Goal {
    constructor(x, y, width, height) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = 'gold'; 
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

// ==========================================
// GAME INITIALIZATION & MAP
// ==========================================
function init() {
    player = new Player();
    scrollOffset = 0; 
    
    // Expanded Level Map
    platforms = [
        new Platform(0, canvas.height - 40, 500, 40),       
        new Platform(600, canvas.height - 40, 800, 40),     
        new Platform(250, 300, 100, 20),                    
        new Platform(800, 200, 100, 20),                    
        new Platform(1100, 300, 150, 20),                   
        new Platform(1500, canvas.height - 40, 1200, 40),   
        new Platform(1900, 250, 150, 20),                   
        new Platform(2200, 150, 100, 20),                   
        new Platform(2500, 250, 100, 20),
        new Platform(2900, canvas.height - 40, 800, 40)     
    ];

    // Place the goal flag at the end
    goal = new Goal(3400, canvas.height - 340, 20, 300); 
}

// ==========================================
// MAIN GAME LOOP
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Environment
    platforms.forEach(platform => platform.draw());
    goal.draw();
    
    // 2. Draw UI (Lives)
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Lives: ${lives}`, 20, 30);

    // 3. Game Over / Win Screens
    if (isGameOver) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '50px Arial';
        ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2);
        return; 
    }

    if (isGameWon) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'gold';
        ctx.font = '50px Arial';
        ctx.fillText("YOU WIN!", canvas.width / 2 - 120, canvas.height / 2);
        return; 
    }

    // 4. Update Player
    player.update();

    // 5. CAMERA SCROLLING & MOVEMENT LOGIC
    if (keys.right && player.position.x < 400) {
        player.velocity.x = SPEED;
    } else if (
        (keys.left && player.position.x > 100) || 
        (keys.left && scrollOffset === 0 && player.position.x > 0)
    ) {
        player.velocity.x = -SPEED;
    } else {
        player.velocity.x = 0; 
        if (keys.right) {
            scrollOffset += SPEED; 
            platforms.forEach(platform => platform.position.x -= SPEED);
            goal.position.x -= SPEED; 
        } else if (keys.left && scrollOffset > 0) {
            scrollOffset -= SPEED;
            platforms.forEach(platform => platform.position.x += SPEED);
            goal.position.x += SPEED;
        }
    }

    // 6. COLLISION DETECTION (Platforms)
    platforms.forEach(platform => {
        const isHorizontallyAligned = 
            player.position.x + player.width >= platform.position.x &&
            player.position.x <= platform.position.x + platform.width;

        if (isHorizontallyAligned) {
            if (
                player.position.y + player.height - player.velocity.y <= platform.position.y && 
                player.position.y + player.height >= platform.position.y
            ) {
                player.velocity.y = 0; 
                player.position.y = platform.position.y - player.height; 
            } else if (
                player.position.y - player.velocity.y >= platform.position.y + platform.height && 
                player.position.y <= platform.position.y + platform.height
            ) {
                player.velocity.y = 0; 
                player.position.y = platform.position.y + platform.height; 
            }
        }
    });

    // 7. WIN / LOSS CONDITIONS
    
    // Win: Touch the Goal Pole
    if (
        player.position.x + player.width >= goal.position.x &&
        player.position.x <= goal.position.x + goal.width &&
        player.position.y + player.height >= goal.position.y
    ) {
        isGameWon = true; 
    }

    // Loss: Fall in a pit
    if (player.position.y > canvas.height) {
        lives -= 1; 
        if (lives <= 0) {
            isGameOver = true;
        } else {
            init(); 
        }
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
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

// Start the game for the first time
init();
animate();