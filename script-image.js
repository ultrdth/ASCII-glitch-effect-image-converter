/* 🎆 ---- https://github.com/ultrdth ---- 🎆 */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const status = document.getElementById('status');

canvas.width = 1280;
canvas.height = 960;

const charWidth = 12;
const charHeight = 20;
const cols = Math.floor(canvas.width / charWidth);
const rows = Math.floor(canvas.height / charHeight);

// Character sets by brightness
const darkChars = ['.', ':', "'", '`', ' '];
const mediumChars = ['*', '+', '=', '-', '~', 'o', 'x'];
const brightChars = ['#', '@', '%', '&', '$', '█', 'M', 'W'];

let sourceImage = null;
let sourceData = null;
let charState = [];
let isAnimating = false;

// ========== LOAD IMAGE ==========
function loadImage(file) {
    status.textContent = 'Processing image...';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Create a canvas to resize the image to our grid size
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = cols;
            tempCanvas.height = rows;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw image scaled to fit our grid
            tempCtx.drawImage(img, 0, 0, cols, rows);
            
            // Get pixel data
            sourceImage = tempCtx.getImageData(0, 0, cols, rows);
            sourceData = sourceImage.data;
            
            // Reset character state
            charState = Array(cols * rows).fill(0).map(() => ({
                char: ' ',
                age: 0,
                offsetX: 0,
                offsetY: 0,
                glitch: 0
            }));
            
            status.textContent = 'Image loaded. Processing...';
            
            if (!isAnimating) {
                isAnimating = true;
                animate();
            }
        };
        img.onerror = function() {
            status.textContent = 'Error loading image. Try another.';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ========== FILE INPUT HANDLER ==========
imageInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        loadImage(e.target.files[0]);
    }
});

function getBrightness(r, g, b) {
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

function getCharForBrightness(brightness) {
    if (brightness < 0.33) return darkChars[Math.floor(Math.random() * darkChars.length)];
    if (brightness < 0.66) return mediumChars[Math.floor(Math.random() * mediumChars.length)];
    return brightChars[Math.floor(Math.random() * brightChars.length)];
}

function updateAnimation() {
    if (!sourceData) return;
    
    for (let i = 0; i < charState.length; i++) {
        charState[i].age++;
        
        // Change character every 3-6 frames
        if (charState[i].age > Math.random() * 3 + 3) {
            const idx = i * 4;
            const r = sourceData[idx];
            const g = sourceData[idx + 1];
            const b = sourceData[idx + 2];
            const brightness = getBrightness(r, g, b);
            
            charState[i].char = getCharForBrightness(brightness);
            charState[i].age = 0;
            charState[i].offsetX = (Math.random() - 0.5) * 1.5;
            charState[i].offsetY = (Math.random() - 0.5) * 1.5;
        }
        
        // Occasional glitch
        if (Math.random() < 0.02) {
            charState[i].glitch = 1;
        } else if (charState[i].glitch > 0) {
            charState[i].glitch *= 0.9;
        }
    }
}

function render() {
    if (!sourceData) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Upload an image', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px monospace';
        ctx.fillText('(any picture works)', canvas.width / 2, canvas.height / 2 + 25);
        return;
    }
    
    // Dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw characters
    ctx.font = 'bold 20px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const state = charState[idx];
            
            const pixelIdx = idx * 4;
            const r = sourceData[pixelIdx];
            const g = sourceData[pixelIdx + 1];
            const b = sourceData[pixelIdx + 2];
            const a = sourceData[pixelIdx + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Use original pixel colors
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            
            const brightness = getBrightness(r, g, b);
            const opacity = Math.max(0.3, brightness);
            ctx.globalAlpha = opacity * (1 - state.glitch * 0.5);
            
            const x = col * charWidth + state.offsetX;
            const y = row * charHeight + state.offsetY + Math.sin(Date.now() * 0.003 + col) * 0.3;
            
            ctx.fillText(state.char, x, y);
            ctx.globalAlpha = 1;
        }
    }
    
    // CRT scanlines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.height; i += charHeight) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Subtle glow
    ctx.fillStyle = 'rgba(0, 255, 255, 0.01)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function animate() {
    updateAnimation();
    render();
    requestAnimationFrame(animate);
}

// Start animation loop
animate();
