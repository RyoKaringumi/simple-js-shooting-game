// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Game Variables
let score = 0;
let gameOver = false;
let animationId;
let bossSpawned = false;
let bossDefeated = false;
let gameTime = 0; // Game time counter
const bossAppearTime = 30 * 60; // Boss appears after 30 seconds (60 fps)

// Player Settings
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5,
    color: '#00FF00',
    shooting: false,
    shootingCooldown: 0,
    shootingDelay: 10,
    health: 3
};

// Keys tracking
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Game Elements Arrays
let bullets = [];
let enemies = [];
let enemyBullets = [];
let stars = [];
let explosions = [];
let boss = null;

// Stars Background
function createStars() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1 + 0.5
        });
    }
}

function updateStars() {
    for (let i = 0; i < stars.length; i++) {
        stars[i].y += stars[i].speed;
        if (stars[i].y > canvas.height) {
            stars[i].y = 0;
            stars[i].x = Math.random() * canvas.width;
        }
    }
}

function drawStars() {
    ctx.fillStyle = 'white';
    for (let i = 0; i < stars.length; i++) {
        ctx.beginPath();
        ctx.arc(stars[i].x, stars[i].y, stars[i].size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Player Bullets
function createBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 8,
        color: '#00FFFF'
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    ctx.fillStyle = '#00FFFF';
    for (let i = 0; i < bullets.length; i++) {
        ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    }
}

// Enemies
function createEnemy() {
    if (bossSpawned && !bossDefeated) return;
    
    const size = Math.random() * 20 + 20;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: Math.random() * 2 + 1,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        health: Math.ceil(size / 10),
        shootingCooldown: Math.floor(Math.random() * 120) + 60,
        initialShootingCooldown: Math.floor(Math.random() * 120) + 60
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Enemy shooting
        if (enemies[i].shootingCooldown <= 0) {
            createEnemyBullet(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height);
            enemies[i].shootingCooldown = enemies[i].initialShootingCooldown;
        } else {
            enemies[i].shootingCooldown--;
        }
        
        // Remove enemies that go off screen
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}

function drawEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        ctx.fillStyle = enemies[i].color;
        ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);
    }
}

// Enemy Bullets
function createEnemyBullet(x, y) {
    enemyBullets.push({
        x: x - 2,
        y: y,
        width: 4,
        height: 8,
        speed: 3,
        color: '#FF0000'
    });
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

function drawEnemyBullets() {
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < enemyBullets.length; i++) {
        ctx.fillRect(
            enemyBullets[i].x,
            enemyBullets[i].y,
            enemyBullets[i].width,
            enemyBullets[i].height
        );
    }
}

// Boss Enemy
function createBoss() {
    boss = {
        x: canvas.width / 2 - 50,
        y: -100,
        width: 100,
        height: 80,
        speed: 1,
        color: '#FF00FF',
        health: 100,
        maxHealth: 100,
        entryPhase: true,
        shootingPattern: 0,
        shootingCooldown: 60,
        patternChangeCooldown: 300,
        moveDirection: 1
    };
    bossSpawned = true;
    bossDefeated = false;
}

function updateBoss() {
    if (!boss) return;
    
    // Boss entry phase
    if (boss.entryPhase) {
        boss.y += 0.5;
        if (boss.y >= 50) {
            boss.entryPhase = false;
        }
        return;
    }
    
    // Boss movement
    boss.x += boss.speed * boss.moveDirection;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
        boss.moveDirection *= -1;
    }
    
    // Boss shooting
    boss.shootingCooldown--;
    if (boss.shootingCooldown <= 0) {
        switch (boss.shootingPattern) {
            case 0:
                // Straight line of bullets
                createEnemyBullet(boss.x + boss.width / 2, boss.y + boss.height);
                boss.shootingCooldown = 15;
                break;
            case 1:
                // Triple shot
                createEnemyBullet(boss.x + boss.width / 4, boss.y + boss.height);
                createEnemyBullet(boss.x + boss.width / 2, boss.y + boss.height);
                createEnemyBullet(boss.x + 3 * boss.width / 4, boss.y + boss.height);
                boss.shootingCooldown = 40;
                break;
            case 2:
                // Spiral pattern
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + (gameTime / 60);
                    const bulletSpeedX = Math.cos(angle) * 2;
                    const bulletSpeedY = Math.sin(angle) * 2 + 1;
                    
                    enemyBullets.push({
                        x: boss.x + boss.width / 2 - 2,
                        y: boss.y + boss.height / 2,
                        width: 4,
                        height: 4,
                        speedX: bulletSpeedX,
                        speedY: bulletSpeedY,
                        color: '#FF0000',
                        type: 'special'
                    });
                }
                boss.shootingCooldown = 60;
                break;
        }
    }
    
    // Change shooting pattern
    boss.patternChangeCooldown--;
    if (boss.patternChangeCooldown <= 0) {
        boss.shootingPattern = (boss.shootingPattern + 1) % 3;
        boss.patternChangeCooldown = 300;
    }
}

function drawBoss() {
    if (!boss) return;
    
    // Draw boss body
    ctx.fillStyle = boss.color;
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    
    // Draw health bar
    const healthBarWidth = boss.width;
    const healthBarHeight = 10;
    const healthPercentage = boss.health / boss.maxHealth;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(boss.x, boss.y - 15, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = 'red';
    ctx.fillRect(boss.x, boss.y - 15, healthBarWidth * healthPercentage, healthBarHeight);
}

// Explosions
function createExplosion(x, y, size) {
    explosions.push({
        x,
        y,
        size,
        opacity: 1,
        particles: []
    });
    
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        
        explosions[explosions.length - 1].particles.push({
            x: x,
            y: y,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            size: Math.random() * size / 4 + 2,
            color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
        });
    }
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].opacity -= 0.02;
        
        for (let j = 0; j < explosions[i].particles.length; j++) {
            explosions[i].particles[j].x += explosions[i].particles[j].speedX;
            explosions[i].particles[j].y += explosions[i].particles[j].speedY;
        }
        
        if (explosions[i].opacity <= 0) {
            explosions.splice(i, 1);
        }
    }
}

function drawExplosions() {
    for (let i = 0; i < explosions.length; i++) {
        const explosion = explosions[i];
        
        for (let j = 0; j < explosion.particles.length; j++) {
            const particle = explosion.particles[j];
            ctx.globalAlpha = explosion.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

// Collision Detection
function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (
                bullets[i] && 
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                enemies[j].health -= 1;
                createExplosion(bullets[i].x, bullets[i].y, 10);
                bullets.splice(i, 1);
                
                if (enemies[j].health <= 0) {
                    createExplosion(
                        enemies[j].x + enemies[j].width / 2,
                        enemies[j].y + enemies[j].height / 2,
                        enemies[j].width
                    );
                    score += Math.floor(enemies[j].width);
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }
    
    // Player bullets hitting boss
    if (boss) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (
                bullets[i].x < boss.x + boss.width &&
                bullets[i].x + bullets[i].width > boss.x &&
                bullets[i].y < boss.y + boss.height &&
                bullets[i].y + bullets[i].height > boss.y
            ) {
                boss.health -= 1;
                createExplosion(bullets[i].x, bullets[i].y, 10);
                bullets.splice(i, 1);
                
                if (boss.health <= 0) {
                    createExplosion(
                        boss.x + boss.width / 2,
                        boss.y + boss.height / 2,
                        boss.width
                    );
                    score += 1000;
                    boss = null;
                    bossDefeated = true;
                }
            }
        }
    }
    
    // Enemy bullets hitting player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (
            enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y
        ) {
            enemyBullets.splice(i, 1);
            player.health--;
            
            if (player.health <= 0) {
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, 30);
                gameOver = true;
            }
            break;
        }
    }
    
    // Enemies hitting player
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (
            enemies[i].x < player.x + player.width &&
            enemies[i].x + enemies[i].width > player.x &&
            enemies[i].y < player.y + player.height &&
            enemies[i].y + enemies[i].height > player.y
        ) {
            createExplosion(
                enemies[i].x + enemies[i].width / 2,
                enemies[i].y + enemies[i].height / 2,
                enemies[i].width
            );
            enemies.splice(i, 1);
            player.health--;
            
            if (player.health <= 0) {
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, 30);
                gameOver = true;
            }
            break;
        }
    }
}

// Player Controls and Movement
function handlePlayerMovement() {
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    
    // Shooting
    if (keys.Space) {
        if (player.shootingCooldown <= 0) {
            createBullet();
            player.shootingCooldown = player.shootingDelay;
        }
    }
    
    if (player.shootingCooldown > 0) {
        player.shootingCooldown--;
    }
}

function drawPlayer() {
    // Draw player ship
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw player health
    for (let i = 0; i < player.health; i++) {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(canvas.width - 30 * (i + 1), 10, 20, 20);
    }
}

// Game Loop
function update() {
    gameTime++;
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw stars
    updateStars();
    drawStars();
    
    if (!gameOver) {
        // Handle player movement
        handlePlayerMovement();
        
        // Update and draw bullets
        updateBullets();
        updateEnemyBullets();
        
        // Update and draw enemies
        updateEnemies();
        
        // Update and draw boss
        updateBoss();
        
        // Update explosions
        updateExplosions();
        
        // Check collisions
        checkCollisions();
        
        // Spawn enemies
        if (Math.random() < 0.02 && !bossSpawned) {
            createEnemy();
        }
        
        // Check if it's time to spawn the boss
        if (gameTime >= bossAppearTime && !bossSpawned && !bossDefeated) {
            createBoss();
        }
        
        // Draw everything
        drawBullets();
        drawEnemyBullets();
        drawEnemies();
        drawBoss();
        drawPlayer();
        drawExplosions();
        
        // Update score display
        document.getElementById('score').textContent = `スコア: ${score}`;
    } else {
        // Game over screen
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
    }
    
    // Continue the game loop if not game over
    if (!gameOver) {
        animationId = requestAnimationFrame(update);
    }
}

// Event Listeners
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space') keys.Space = true;
    
    // Prevent scrolling with space bar
    if (e.code === 'Space') e.preventDefault();
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
});

document.getElementById('restartBtn').addEventListener('click', () => {
    // Reset game variables
    score = 0;
    gameOver = false;
    gameTime = 0;
    bossSpawned = false;
    bossDefeated = false;
    player.health = 3;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    
    // Clear arrays
    bullets = [];
    enemies = [];
    enemyBullets = [];
    explosions = [];
    boss = null;
    
    // Hide game over screen
    document.getElementById('gameOver').classList.add('hidden');
    
    // Start game again
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
});

// Initialize and Start Game
function init() {
    createStars();
    animationId = requestAnimationFrame(update);
}

// Start the game when the window loads
window.onload = init;