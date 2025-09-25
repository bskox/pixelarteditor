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

let gridWidth = 16;
let gridHeight = 16;
let pixelSize = 20;
let isDrawing = false;
let currentColor = colorPicker.value;

let undoStack = [];
let redoStack = [];

// ================== Canvas Setup ==================
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

// ================== Colors ==================
const basicColors = ["#FF0000", "#0000FF", "#008000", "#000000", "#FFFFFF", "#FFA500"];
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

colorPicker.addEventListener('input', (e) => {
  currentColor = e.target.value;
});

// ================== Shade Function ==================
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if(max === min) { h = s = 0; } 
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
  if(s===0){ r=g=b=l; } 
  else {
    const hue2rgb = (p,q,t)=>{
      if(t<0) t+=1;
      if(t>1) t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    }
    const q = l<0.5? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r = hue2rgb(p,q,h+1/3);
    g = hue2rgb(p,q,h);
    b = hue2rgb(p,q,h-1/3);
  }
  return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
}

function rgbToHex(r,g,b){
  return "#" + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

function shadeColor(hex, amount){
  const rgb = hexToRgb(hex);
  let hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l *= (1 - amount/100);
  const shaded = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(shaded.r, shaded.g, shaded.b);
}

// ================== Drawing ==================
function drawPixel(x,y){
  let colorToDraw = currentColor;
  if(shadeSlider.value > 0){
    colorToDraw = shadeColor(currentColor, parseInt(shadeSlider.value));
  }
  ctx.fillStyle = colorToDraw;
  ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
}

// ================== Undo/Redo ==================
function saveState(){
  undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  redoStack = [];
}

function undo(){
  if(undoStack.length > 0){
    redoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    const prev = undoStack.pop();
    ctx.putImageData(prev,0,0);
  }
}

function redo(){
  if(redoStack.length > 0){
    undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    const next = redoStack.pop();
    ctx.putImageData(next,0,0);
  }
}

// ================== Mouse Events ==================
canvas.addEventListener('mousedown', e => { saveState(); isDrawing=true; });
canvas.addEventListener('mouseup', () => isDrawing=false);
canvas.addEventListener('mouseleave', () => isDrawing=false);

canvas.addEventListener('mousemove', e => {
  if(!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX-rect.left)/pixelSize);
  const y = Math.floor((e.clientY-rect.top)/pixelSize);
  drawPixel(x,y);
});

// ================== Buttons ==================
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

clearBtn.addEventListener('click', () => {
  saveState();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
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

setCanvas();
