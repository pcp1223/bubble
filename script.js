const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let bubbles = [];

// Utility function to get a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

class Bubble {
    constructor(x, y, radius, speed, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed; // speed at which it floats upwards
        this.color = color;
        this.markedForDeletion = false; // Flag to remove bubble after popping or going off-screen
    }

    update() {
        this.y -= this.speed; // Move bubble upwards
        // Mark for deletion if it goes off-screen
        if (this.y + this.radius < 0) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // White border for bubble effect
        ctx.stroke();
        ctx.closePath();
    }
}

class PopEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.maxRadius = Math.random() * 10 + 5; // Max radius for pop fragments
        this.speed = Math.random() * 0.5 + 0.5; // Expansion speed
        this.opacity = 1;
        this.markedForDeletion = false;
    }

    update() {
        this.radius += this.speed;
        this.opacity -= 0.05; // Fade out
        if (this.opacity <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

let bubbleTimer = 0;
let bubbleInterval = 1000; // Milliseconds between new bubble spawns
let lastTime = 0;
let popEffects = []; // Array to store active pop effects

function handleBubbles() {
    // Generate new bubbles
    if (bubbleTimer > bubbleInterval) {
        const radius = Math.random() * 20 + 20; // Bubbles between 20 and 40 radius
        const x = Math.random() * (canvas.width - radius * 2) + radius; // Ensure bubble spawns fully within canvas
        const y = canvas.height + radius; // Spawn just below the canvas
        const speeds = [0.8, 1.2, 1.6, 2.0, 2.4, 2.8]; // 6 distinct speeds
        const speed = speeds[Math.floor(Math.random() * speeds.length)];
        const color = getRandomColor();
        bubbles.push(new Bubble(x, y, radius, speed, color));
        bubbleTimer = 0;
    } else {
        bubbleTimer += 16.67; // Assuming 60fps, roughly 1000/60 ms
    }

    // Update and draw bubbles
    for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].update();
        bubbles[i].draw();
    }

    // Update and draw pop effects
    for (let i = 0; i < popEffects.length; i++) {
        popEffects[i].update();
        popEffects[i].draw();
    }

    // Filter out bubbles and pop effects marked for deletion
    bubbles = bubbles.filter(bubble => !bubble.markedForDeletion);
    popEffects = popEffects.filter(effect => !effect.markedForDeletion);
}

function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    handleBubbles();

    requestAnimationFrame(animate);
}

    animate(0); // Start the game loop

// Event Listener for Bubble Popping
canvas.addEventListener('click', function(event) {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        const distance = Math.sqrt(
            (mouseX - bubble.x) * (mouseX - bubble.x) +
            (mouseY - bubble.y) * (mouseY - bubble.y)
        );

        if (distance < bubble.radius) {
            // Collision detected! Pop the bubble.
            bubble.markedForDeletion = true;
            
            // Create a pop effect
            popEffects.push(new PopEffect(bubble.x, bubble.y, bubble.color));
            
            // Implement different scoring for different sized bubbles
            if (bubble.radius < 25) { // Small bubble
                score += 3;
            } else if (bubble.radius < 35) { // Medium bubble
                score += 2;
            } else { // Large bubble
                score += 1;
            }
            scoreDisplay.textContent = score;

            break; // Only pop one bubble per click
        }
    }
});
