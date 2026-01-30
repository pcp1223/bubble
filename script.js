const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

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

const cloudContainer = document.getElementById('cloud-container');
let clouds = []; // Array to hold Cloud objects

class Cloud {
    constructor(layer) {
        this.image = new Image();
        this.image.src = 'cloud.png'; // Assuming cloud.png is in the same directory
        this.layer = layer;
        this.width = Math.random() * 150 + 100; // Cloud width between 100-250px
        this.height = this.width * 0.6; // Maintain aspect ratio
        this.x = -this.width; // Start off-screen left
        this.y = Math.random() * (canvas.height / 5 * (layer + 1)) - this.height / 2; // Position in layer band
        this.speed = ((Math.random() * 0.3 + 0.1) * (layer + 1)) / 10; // Slower for lower layers, 1/10th of original speed

        this.element = document.createElement('img');
        this.element.src = this.image.src;
        this.element.className = 'cloud';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.position = 'absolute';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.opacity = 0.5 + layer * 0.1; // More opaque for foreground layers
        cloudContainer.appendChild(this.element);
    }

    update() {
        this.x += this.speed;
        if (this.x > canvas.width) {
            this.x = -this.width; // Reset to left
            this.y = Math.random() * (canvas.height / 5 * (this.layer + 1)) - this.height / 2; // New random y
            this.speed = ((Math.random() * 0.3 + 0.1) * (this.layer + 1)) / 10; // New random speed (1/10th)
            this.width = Math.random() * 150 + 100;
            this.height = this.width * 0.6;
            this.element.style.width = `${this.width}px`;
            this.element.style.height = `${this.height}px`;
            this.element.style.top = `${this.y}px`;
            this.element.style.opacity = 0.5 + this.layer * 0.1;
        }
        this.element.style.left = `${this.x}px`;
    }
}

let bubbleTimer = 0;
let minBubbleInterval = 500; // Minimum milliseconds between new bubble spawns (fast)
let maxBubbleInterval = 2000; // Maximum milliseconds between new bubble spawns (slow)
let bubbleInterval = Math.random() * (maxBubbleInterval - minBubbleInterval) + minBubbleInterval; // Initial random interval
let lastTime = 0;
let popEffects = []; // Array to store active pop effects

function handleGameElements() {
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
        // Randomize the next bubbleInterval
        bubbleInterval = Math.random() * (maxBubbleInterval - minBubbleInterval) + minBubbleInterval;
    } else {
        bubbleTimer += 16.67; // Assuming 60fps, roughly 1000/60 ms
    }

    // Update clouds (DOM elements)
    clouds.forEach(cloud => {
        cloud.update();
    });

    // Update and draw bubbles (midground)
    for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].update();
        bubbles[i].draw();
    }

    // Update and draw pop effects (foreground)
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

    handleGameElements(); // Call the unified handler

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

// Initial cloud generation
for (let layer = 0; layer < 5; layer++) {
    const numClouds = Math.random() * 2 + 1; // 1 to 3 clouds per layer
    for (let i = 0; i < numClouds; i++) {
        clouds.push(new Cloud(layer));
    }
}
