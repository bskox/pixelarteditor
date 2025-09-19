const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('color-picker');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const gridSizeInput = document.getElementById('grid-size');
const resizeBtn = document.getElementById('resize-btn');

let gridSize = 16; // default grid
let pixelSize = 20; // pixel size in px
let isDrawing = false;
let currentColor = colorPicker.value;

// Set canvas size based on grid
function setCanvas() {
  canvas.width = gridSize * pixelSize;
  canvas.height = gridSize * pixelSize;
  drawGrid();
}

// Draw the grid lines
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ccc';
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * pixelSize, 0);
    ctx.lineTo(i * pixelSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * pixelSize);
    ctx.lineTo(canvas.width, i * pixelSize);
    ctx.stroke();
  }
}
const basicColors = ["#FF0000", "#0000FF", "#008000", "#000000", "#FFFFFF", "#FFA500"]; // red, blue, green, black, white, orange

const basicColorsContainer = document.getElementById("basic-colors");

// Create buttons for basic colors
basicColors.forEach(color => {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.style.backgroundColor = color;
  btn.addEventListener("click", () => {
    currentColor = color;
    colorPicker.value = color; // sync with color picker
  });
  basicColorsContainer.appendChild(btn);
});

// Draw a pixel at the given position
function drawPixel(x, y) {
  ctx.fillStyle = currentColor;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Mouse events
canvas.addEventListener('mousedown', () => isDrawing = true);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  drawPixel(x, y);
});

// Update color
colorPicker.addEventListener('input', (e) => {
  currentColor = e.target.value;
});

// Clear canvas
clearBtn.addEventListener('click', drawGrid);

// Save canvas as PNG
saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'pixel-art.png';
  link.href = canvas.toDataURL();
  link.click();
});

// Resize grid
resizeBtn.addEventListener('click', () => {
  const newSize = parseInt(gridSizeInput.value);
  if (newSize >= 8 && newSize <= 64) {
    gridSize = newSize;
    setCanvas();
  }
});

// Initialize
setCanvas();
