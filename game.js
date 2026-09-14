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
let coinsCount = 0; // NEW: Coin Tracker
let isGameOver = false;
let isGameWon = false;

let player;
let platforms = [];
let coins = []; // NEW: Array to hold loose coins in the level
let goal; 
let scrollOffset = 0;
let maxScrollOffset = 0; 
const keys = { right: false, left: false };

// ==========================================
// CLASSES
// ==========================================
class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        
        this.width = 41.25;  
        this.height = 60;    

        this.image = new Image();
        this.image.src = './assets/images/movement-no-bg.png'; 

        this.frames = 0;       
        this.tickCount = 0;    
        this.state = 'idle';   

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
            ctx.translate(this.position.x + this.width, this.position.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, sx, sy, this.width, this.height, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(this.image, sx, sy, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
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
    constructor(x, y, width, height, type = 'ground', imageSrc = null) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.type = type; 
        
        this.isHit = false; // NEW: Tracks if a mystery block has been bumped

        if (imageSrc) {
            this.image = new Image();
            this.image.src = imageSrc;
        } else {
            this.image = null;
        }
    }

    draw() {
        if (this.image) {
            ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
            return;
        }

        if (this.type === 'ground') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            ctx.fillStyle = '#00A800';
            ctx.fillRect(this.position.x, this.position.y, this.width, 10);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        } 
        else if (this.type === 'brick') {
            ctx.fillStyle = '#C84C0C';
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
            ctx.fillStyle = '#FC9838';
            ctx.fillRect(this.position.x + 4, this.position.y + 4, this.width - 8, 4);
        } 
        // NEW: MYSTERY BLOCK DRAWING LOGIC
        else if (this.type === 'mystery') {
            if (!this.isHit) {
                // Active State: Gold with a '?'
                ctx.fillStyle = '#FCD800';
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 24px monospace';
                ctx.fillText('?', this.position.x + 12, this.position.y + 28);
            } else {
                // Empty State: Dark brown metal block
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
                
                // Draw bolts in the corners to look like the classic empty block
                ctx.fillStyle = '#000';
                ctx.fillRect(this.position.x + 4, this.position.y + 4, 4, 4);
                ctx.fillRect(this.position.x + this.width - 8, this.position.y + 4, 4, 4);
                ctx.fillRect(this.position.x + 4, this.position.y + this.height - 8, 4, 4);
                ctx.fillRect(this.position.x + this.width - 8, this.position.y + this.height - 8, 4, 4);
            }
        }
        else if (this.type === 'pipe') {
            const rimHeight = 25;
            const rimOverhang = 6;
            ctx.fillStyle = '#00A800';
            ctx.fillRect(this.position.x, this.position.y + rimHeight, this.width, this.height - rimHeight);
            ctx.fillStyle = '#80D010';
            ctx.fillRect(this.position.x + 6, this.position.y + rimHeight, 10, this.height - rimHeight);
            ctx.fillStyle = '#005800';
            ctx.fillRect(this.position.x + this.width - 12, this.position.y + rimHeight, 10, this.height - rimHeight);
            ctx.fillStyle = '#00A800';
            ctx.fillRect(this.position.x - rimOverhang, this.position.y, this.width + (rimOverhang * 2), rimHeight);
            ctx.fillStyle = '#80D010';
            ctx.fillRect(this.position.x - rimOverhang + 6, this.position.y, 10, rimHeight);
            ctx.fillStyle = '#005800';
            ctx.fillRect(this.position.x + this.width + rimOverhang - 12, this.position.y, 10, rimHeight);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.position.x - rimOverhang, this.position.y, this.width + (rimOverhang * 2), rimHeight);
            ctx.strokeRect(this.position.x, this.position.y + rimHeight, this.width, this.height - rimHeight);
        }
    }
}

// NEW: COIN CLASS
class Coin {
    constructor(x, y) {
        this.position = { x, y };
        this.width = 20;
        this.height = 30;
    }

    draw() {
        ctx.fillStyle = '#FCD800'; // Gold
        ctx.beginPath();
        // Draw an oval (ellipse) to look like a spinning coin
        ctx.ellipse(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#DAA520'; // Darker gold inner ring
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Goal {
    constructor(x, y, width, height) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = '#E4E4E4'; 
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        ctx.fillStyle = '#FCD800';
        ctx.beginPath();
        ctx.arc(this.position.x + (this.width / 2), this.position.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00A800';
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y + 15);
        ctx.lineTo(this.position.x - 45, this.position.y + 35);
        ctx.lineTo(this.position.x, this.position.y + 55);
        ctx.closePath();
        ctx.fill();
    }
}

// ==========================================
// GAME INITIALIZATION & LEVEL 1 DESIGN
// ==========================================
function init() {
    player = new Player();
    scrollOffset = 0; 
    
    platforms = [
        new Platform(0, canvas.height - 40, 800, 40, 'ground'),       
        new Platform(920, canvas.height - 40, 1200, 40, 'ground'),     
        new Platform(2300, canvas.height - 40, 1500, 40, 'ground'),                   
        new Platform(4000, canvas.height - 40, 2000, 40, 'ground'),  
        
        new Platform(500, canvas.height - 110, 60, 70, 'pipe'),       
        new Platform(1300, canvas.height - 140, 60, 100, 'pipe'),     
        new Platform(2700, canvas.height - 160, 60, 120, 'pipe'),     

        new Platform(300, canvas.height - 150, 120, 40, 'brick'),                    
        
        // NEW: MYSTERY BLOCKS (40x40 squares)
        new Platform(650, canvas.height - 200, 40, 40, 'mystery'),                    
        new Platform(690, canvas.height - 200, 40, 40, 'brick'),                    
        new Platform(730, canvas.height - 200, 40, 40, 'mystery'),                    
        
        new Platform(1500, canvas.height - 160, 150, 40, 'brick'),                   
        new Platform(1750, canvas.height - 240, 120, 40, 'brick'),                   
        new Platform(3200, canvas.height - 160, 180, 40, 'brick'),                   
        
        new Platform(5000, canvas.height - 80, 40, 40, 'brick'),
        new Platform(5040, canvas.height - 120, 40, 80, 'brick'),
        new Platform(5080, canvas.height - 160, 40, 120, 'brick'),
        new Platform(5120, canvas.height - 200, 40, 160, 'brick'),
        new Platform(5160, canvas.height - 240, 40, 200, 'brick'),
        new Platform(5200, canvas.height - 280, 40, 240, 'brick')
    ];

    // NEW: LOOSE COINS ON THE MAP
    coins = [
        new Coin(350, canvas.height - 200),
        new Coin(400, canvas.height - 200),
        new Coin(1550, canvas.height - 210),
        new Coin(1600, canvas.height - 210),
        new Coin(2500, canvas.height - 90),
        new Coin(2550, canvas.height - 90),
        new Coin(2600, canvas.height - 90)
    ];

    goal = new Goal(5600, canvas.height - 340, 15, 300); 
    maxScrollOffset = 5100; 
}

// ==========================================
// MAIN GAME LOOP
// ==========================================
function animate() {
    if (isGameOver || isGameWon) return; 

    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    platforms.forEach(platform => platform.draw());
    
    // NEW: Draw Coins
    coins.forEach(coin => coin.draw());
    
    goal.draw();
    
    // Draw Lives & Coins UI
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`LIVES: ${lives}`, 20, 35);
    
    // Draw Coin counter in gold
    ctx.fillStyle = '#FCD800'; 
    ctx.fillText(`COINS: ${coinsCount}`, 150, 35);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeText(`COINS: ${coinsCount}`, 150, 35);

    player.update();

    // ==========================================
    // WALL COLLISION RADAR
    // ==========================================
    let canMoveRight = true;
    let canMoveLeft = true;

    platforms.forEach(platform => {
        if (
            player.position.y + player.height > platform.position.y + 6 &&
            player.position.y < platform.position.y + platform.height - 6
        ) {
            if (
                player.position.x + player.width <= platform.position.x &&
                player.position.x + player.width + SPEED >= platform.position.x
            ) {
                canMoveRight = false;
            }
            if (
                player.position.x >= platform.position.x + platform.width &&
                player.position.x - SPEED <= platform.position.x + platform.width
            ) {
                canMoveLeft = false;
            }
        }
    });

    // ==========================================
    // COIN COLLECTION (AABB Collision)
    // ==========================================
    coins.forEach((coin, index) => {
        if (
            player.position.x < coin.position.x + coin.width &&
            player.position.x + player.width > coin.position.x &&
            player.position.y < coin.position.y + coin.height &&
            player.position.y + player.height > coin.position.y
        ) {
            coinsCount++;
            coins.splice(index, 1); // Remove the coin from the array once touched
        }
    });

    // ==========================================
    // CAMERA & MOVEMENT (Updated to move loose coins)
    // ==========================================
    if (keys.right && canMoveRight && player.position.x < 400) {
        player.velocity.x = SPEED;
    } else if (keys.right && canMoveRight && scrollOffset >= maxScrollOffset && player.position.x < canvas.width - player.width) {
        player.velocity.x = SPEED;
    } else if (
        (keys.left && canMoveLeft && player.position.x > 100) || 
        (keys.left && canMoveLeft && scrollOffset === 0 && player.position.x > 0) ||
        (keys.left && canMoveLeft && scrollOffset >= maxScrollOffset && player.position.x > 0)
    ) {
        player.velocity.x = -SPEED;
    } else {
        player.velocity.x = 0; 
        
        if (keys.right && canMoveRight && scrollOffset < maxScrollOffset) {
            scrollOffset += SPEED; 
            platforms.forEach(platform => platform.position.x -= SPEED);
            coins.forEach(coin => coin.position.x -= SPEED); // Move coins with the camera!
            goal.position.x -= SPEED; 
        } else if (keys.left && canMoveLeft && scrollOffset > 0) {
            scrollOffset -= SPEED;
            platforms.forEach(platform => platform.position.x += SPEED);
            coins.forEach(coin => coin.position.x += SPEED); // Move coins with the camera!
            goal.position.x += SPEED;
        }
    }

    // ==========================================
    // FLOOR & CEILING COLLISION (with Mystery Block logic)
    // ==========================================
    platforms.forEach(platform => {
        const isHorizontallyAligned = 
            player.position.x + player.width > platform.position.x &&
            player.position.x < platform.position.x + platform.width;

        if (isHorizontallyAligned) {
            // Landing on platform 
            if (
                player.position.y + player.height - player.velocity.y <= platform.position.y && 
                player.position.y + player.height >= platform.position.y
            ) {
                player.velocity.y = 0; 
                player.position.y = platform.position.y - player.height; 
            } 
            // Bumping ceiling / block from below
            else if (
                player.position.y - player.velocity.y >= platform.position.y + platform.height && 
                player.position.y <= platform.position.y + platform.height
            ) {
                player.velocity.y = 0; 
                player.position.y = platform.position.y + platform.height; 
                
                // NEW: MYSTERY BLOCK HIT TRIGGER
                if (platform.type === 'mystery' && !platform.isHit) {
                    platform.isHit = true;
                    coinsCount++; // Give Mario a coin!
                    
                    // Optional: You can add sound or a bouncing coin animation here in the future!
                }
            }
        }
    });

    // ==========================================
    // WIN / LOSS CONDITIONS
    // ==========================================
    if (
        player.position.x + player.width >= goal.position.x &&
        player.position.x <= goal.position.x + goal.width &&
        player.position.y + player.height >= goal.position.y
    ) {
        isGameWon = true; 
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FCD800';
        ctx.font = 'bold 48px monospace';
        ctx.fillText("YOU WIN!", canvas.width / 2 - 110, canvas.height / 2);
        ctx.font = '20px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText("Press ENTER to Restart", canvas.width / 2 - 130, canvas.height / 2 + 50);
    }

    if (player.position.y > canvas.height) {
        lives -= 1; 
        if (lives <= 0) {
            isGameOver = true;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#E52521';
            ctx.font = 'bold 48px monospace';
            ctx.fillText("GAME OVER", canvas.width / 2 - 130, canvas.height / 2);
            ctx.font = '20px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText("Press ENTER to Restart", canvas.width / 2 - 130, canvas.height / 2 + 50);
        } else {
            init(); 
        }
    }
}

// ==========================================
// CONTROLS
// ==========================================
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyA': 
        case 'ArrowLeft': 
            keys.left = true; break;
        case 'KeyD': 
        case 'ArrowRight': 
            keys.right = true; break;
        case 'KeyW': 
        case 'ArrowUp': 
        case 'Space': 
            if (player.velocity.y === 0) player.velocity.y = JUMP_POWER; 
            break;
        case 'Enter': 
            if (isGameOver || isGameWon) {
                lives = 3; 
                coinsCount = 0; // Reset coins on a full restart!
                isGameOver = false;
                isGameWon = false;
                init();
                animate();
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyA': 
        case 'ArrowLeft': 
            keys.left = false; break;
        case 'KeyD': 
        case 'ArrowRight': 
            keys.right = false; break;
    }
});

init();
animate();