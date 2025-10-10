// Połączenie z serwerem Socket.IO
const socket = io();

// Elementy canvas i UI
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gridCanvas = document.getElementById('grid');
const gridCtx = gridCanvas.getContext('2d');

const colorPicker = document.getElementById('color-picker');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const shadeSlider = document.getElementById('shade');
const gridWidthInput = document.getElementById('grid-width');
const gridHeightInput = document.getElementById('grid-height');
const resizeBtn = document.getElementById('resize-btn');
const nightModeBtn = document.getElementById('night-mode-btn');
const brushSizeSelect = document.getElementById('brushSize');
const brushIncreaseBtn = document.getElementById('brush-increase');
const brushDecreaseBtn = document.getElementById('brush-decrease');

let gridWidth = 32;
let gridHeight = 32;
let pixelSize = 20;
let isDrawing = false;
let currentColor = colorPicker.value;
let undoStack = [];
let redoStack = [];
let brushSize = parseInt(brushSizeSelect.value);
let isPipetteActive = false;

// Ustawienia canvas
function setCanvas() {
  canvas.width = gridWidth * pixelSize;
  canvas.height = gridHeight * pixelSize;
  gridCanvas.width = gridWidth * pixelSize;
  gridCanvas.height = gridHeight * pixelSize;
  drawGrid();
}

function drawGrid() {
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  gridCtx.strokeStyle = '#ccc';
  for (let x = 0; x <= gridWidth; x++) {
    gridCtx.beginPath();
    gridCtx.moveTo(x * pixelSize, 0);
    gridCtx.lineTo(x * pixelSize, gridCanvas.height);
    gridCtx.stroke();
  }
  for (let y = 0; y <= gridHeight; y++) {
    gridCtx.beginPath();
    gridCtx.moveTo(0, y * pixelSize);
    gridCtx.lineTo(gridCanvas.width, y * pixelSize);
    gridCtx.stroke();
  }
}

// Kolory bazowe
const basicColors = [
  "#FFFFFF", "#FF0000", "#028bed", "#0eeb15", "#000000",
  "#FFA500", "#82440a", "#f760ed","#f9fc30", "#f59920",
  "#964B00", "#808080", "#FFFF00", "#00FF00", "#00FFFF",
  "#0000FF", "#800080", "#FFC0CB", "#A52A2A", "#808000"
];
const basicColorsContainer = document.getElementById("basic-colors");
basicColors.forEach(color => {
  const btn = document.createElement("div");
  btn.className = "color-btn";
  btn.style.backgroundColor = color;
  btn.addEventListener("click", () => {
    currentColor = color;
    colorPicker.value = color;
  });
  basicColorsContainer.appendChild(btn);
});

colorPicker.addEventListener('input', (e) => currentColor = e.target.value);

// Funkcje pomocnicze koloru
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function rgbToHex(r,g,b){ return "#" + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h,s,l = (max+min)/2;
  if(max===min){h=s=0;}
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b)/d + (g < b ? 6 : 0); break;
      case g: h = (b - r)/d + 2; break;
      case b: h = (r - g)/d + 4; break;
    }
    h /= 6;
  }
  return {h,s,l};
}
function hslToRgb(h,s,l){
  let r,g,b;
  if(s===0){r=g=b=l;}
  else{
    const hue2rgb=(p,q,t)=>{
      if(t<0)t+=1;
      if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q=l<0.5?l*(1+s):l+s-l*s;
    const p=2*l-q;
    r=hue2rgb(p,q,h+1/3);
    g=hue2rgb(p,q,h);
    b=hue2rgb(p,q,h-1/3);
  }
  return {r:Math.round(r*255),g:Math.round(g*255),b:Math.round(b*255)};
}
function shadeColor(hex, amount){
  const rgb = hexToRgb(hex);
  let hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l *= (1 - amount/100);
  const shaded = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(shaded.r, shaded.g, shaded.b);
}

// Rysowanie pikseli
function drawPixel(x, y, emit = true, color = null, size = brushSize) {
  let colorToDraw = color || currentColor;
  if (shadeSlider.value > 0 && !color) {
    colorToDraw = shadeColor(currentColor, parseInt(shadeSlider.value));
  }
  ctx.fillStyle = colorToDraw;

  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      const px = x + dx, py = y + dy;
      if (px < gridWidth && py < gridHeight) {
        ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  if (emit && socket) {
    socket.emit("draw_pixel", { x, y, color: colorToDraw, size });
  }
}

function saveState(){
  undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  redoStack = [];
}

// Cofanie i przywracanie z synchronizacją
function undo(emit = true) {
  if (undoStack.length > 0) {
    redoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    const prev = undoStack.pop();
    ctx.putImageData(prev,0,0);
    if (emit && socket) socket.emit("undo_action");
  }
}
function redo(emit = true) {
  if (redoStack.length > 0) {
    undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    const next = redoStack.pop();
    ctx.putImageData(next,0,0);
    if (emit && socket) socket.emit("redo_action");
  }
}

// Rysowanie myszy
canvas.addEventListener('mousedown', e => {
  if (isPipetteActive) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left));
    const y = Math.floor((e.clientY - rect.top));
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
    currentColor = hex;
    colorPicker.value = hex;
    isPipetteActive = false;
    canvas.style.cursor = 'crosshair';
    pipetteBtn.classList.remove('active');
  } else {
    saveState();
    isDrawing = true;
  }
});
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mousemove', e => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  drawPixel(x, y);
});

// Przyciski akcji
undoBtn.addEventListener('click', () => undo());
redoBtn.addEventListener('click', () => redo());
clearBtn.addEventListener('click', () => {
  saveState();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  socket.emit("clear_canvas");
});
saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'pixel-art.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
resizeBtn.addEventListener('click', () => {
  const newWidth = parseInt(gridWidthInput.value);
  const newHeight = parseInt(gridHeightInput.value);
  if(newWidth>=4 && newWidth<=2000 && newHeight>=4 && newHeight<=2000){
    gridWidth = newWidth;
    gridHeight = newHeight;
    setCanvas();
    ctx.clearRect(0,0,canvas.width,canvas.height);
  } else {
    alert("Width and height must be between 4 and 2000.");
  }
});
nightModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('night-mode');
  nightModeBtn.classList.toggle('active');
});

// Pipeta
const pipetteBtn = document.createElement('button');
pipetteBtn.id = 'pipette-btn';
pipetteBtn.className = 'icon-btn';
pipetteBtn.title = 'Pipette Tool 🎨';
pipetteBtn.textContent = '🎨';
document.querySelector('.navbar-icons').insertBefore(pipetteBtn, undoBtn);
pipetteBtn.addEventListener('click', () => {
  isPipetteActive = !isPipetteActive;
  pipetteBtn.classList.toggle('active');
  canvas.style.cursor = isPipetteActive ? 'copy' : 'crosshair';
});

// Zmiana rozmiaru pędzla
brushSizeSelect.addEventListener('change', e => brushSize = parseInt(e.target.value));
brushIncreaseBtn.addEventListener('click', () => {
  brushSize = Math.min(10, brushSize + 1);
  brushSizeSelect.value = brushSize;
});
brushDecreaseBtn.addEventListener('click', () => {
  brushSize = Math.max(1, brushSize - 1);
  brushSizeSelect.value = brushSize;
});

// Skróty klawiaturowe
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); redo(); }
  if (e.key.toLowerCase() === 'p') pipetteBtn.click();
  if (e.key.toLowerCase() === 'r') resizeBtn.click();
  if (e.key.toLowerCase() === 'delete' || e.key.toLowerCase() === 'backspace') clearBtn.click();
});

// Inicjalizacja
setCanvas();

// Socket.IO – synchronizacja
socket.on("draw_pixel", data => drawPixel(data.x, data.y, false, data.color, data.size));
socket.on("clear_canvas", () => { ctx.clearRect(0,0,canvas.width,canvas.height); drawGrid(); });
socket.on("undo_action", () => undo(false));
socket.on("redo_action", () => redo(false));


socket.on("request_canvas_state", () => {
  const data = canvas.toDataURL();
  socket.emit("send_canvas_state", data);
});
socket.on("load_canvas_state", (imgData) => {
  const img = new Image();
  img.onload = () => ctx.drawImage(img, 0, 0);
  img.src = imgData;
});


socket.emit("new_client_ready");
