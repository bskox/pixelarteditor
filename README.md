# Dokumentacja Pixel Art Editor

## Spis treści
1. [Opis projektu](#opis-projektu)
2. [Frontend](#frontend)
   - [1. Połączenie z serwerem](#1-połączenie-z-serwerem)
   - [2. Konfiguracja canvas oraz siatki](#2-konfiguracja-canvas-oraz-siatki)
   - [3. Rysowanie pikseli](#3-rysowanie-pikseli)
   - [4. Cofanie i ponawianie (Undo/Redo)](#4-cofanie-i-ponawianie-undoredo)
   - [5. Funkcje konwersji](#5-funkcje-konwersji)
   - [6. Pipeta](#6-pipeta)
   - [7. Gumka](#7-gumka)
   - [8. Rozmiar pędzla](#8-rozmiar-pędzla)
   - [9. Zoom obszaru roboczego](#9-zoom-obszaru-roboczego)
   - [10. Zapisywanie do PNG](#10-zapisywanie-do-png)
   - [11. Wczytywanie obrazów](#11-wczytywanie-obrazu)
   - [12. Synchronizacja Socket.IO](#12-synchronizacja-socketio)
   - [13. Skróty klawiszowe](#13-skróty-klawiszowe)
3. [Backend](#backend)
   - [1. Serwer Node.js + Express](#1-serwer-nodejs--express)
   - [2. Socket.IO – synchronizacja akcji](#2-socketio--synchronizacja-akcji)
4. [Inicjalizacja aplikacji](#inicjalizacja-aplikacji)

---

## Opis
Pixel Art Editor to edytor grafiki pikselowej z możliwością współpracy w czasie rzeczywistym.  
Funkcje obejmują: rysowanie pikseli, pipetę, gumkę, zmianę rozmiaru pędzla, zoom, cofanie/ponawianie akcji, eksport do PNG oraz wczytywanie obrazów.  
Współpraca w czasie rzeczywistym realizowana jest przez Socket.IO.

---

# Frontend

## 1. Połączenie z serwerem
```js
const socket = io();
```
Łączy klienta z backendem i umożliwia przesyłanie zdarzeń w czasie rzeczywistym.

---

## 2. Konfiguracja canvas oraz siatki
```js
function setCanvas()
function drawGrid()
```
- Tworzy obszar roboczy (`canvas`) o wymiarach `gridWidth × gridHeight × pixelSize`
- Rysuje siatkę na osobnym canvasie (`gridCanvas`) w celu zachowania widoczności podczas malowania

---

## 3. Rysowanie pikseli
```js
function drawPixel(x, y, emit=true, color=null, size=brushSize)
```
- Obsługuje rysowanie pędzlem o zmiennym rozmiarze
- Obsługuje gumkę i shading koloru
- Wysyła akcję do innych użytkowników, jeśli `emit=true`

---

## 4. Cofanie i ponawianie (Undo/Redo)
```js
function saveState()
function undo(emit=true)
function redo(emit=true)
```
- Historia rysunku przechowywana w stosach `undoStack` i `redoStack`
- Undo/Redo mogą być synchronizowane z innymi klientami

---
## 5. Funkcje konwersji
```js
function hexToRgb(hex)
function rgbToHsl(r, g, b)
function hslToRgb(h, s, l)
function shadeColor(hex, amount)
```
- Zamiana wartosci heksadecymalnej koloru na zapis RGB(Red,Green,Blue)
- Zamiana wartosci RGB na zapis HSL(Hue, Saturation, Lightness)
- Zamiana wartosci HSL spowrotem na zapis RGB
- Funkcja cieniowania koloru, wykorzystuje wartosc heksadecymalna(hex) i ilosc cieniowania(amount)

---
## 6. Pipeta
- Pobiera kolor z wybranego piksela na canvasie
- Aktualizuje `currentColor` oraz `colorPicker.value`

---

## 7. Gumka
- Usuwa piksele zamiast je malować
- Wyłącza pipetę w przypadku kolizji trybów

---

## 8. Rozmiar pędzla
- Zakres 1–10
- Zmiana rozmiaru wpływa na liczbę rysowanych pikseli

---

## 9. Zoom obszaru roboczego
```js
applyZoom()
```
- Skalowanie canvasu CSS `transform: scale(...)`
- Obsługa przyciskami oraz scroll kółkiem myszy

---

## 10. Zapisywanie do PNG
- Pobiera stan canvas i zapisuje jako plik PNG

---

## 11. Wczytywanie obrazu
- Obsługa importu plików graficznych
- Automatyczne dostosowanie siatki przy obrazach wygenerowanych w edytorze

---

## 12. Synchronizacja Socket.IO
Kanały:
```
draw_pixel
clear_canvas
undo_action
redo_action
load_canvas_state
send_canvas_state
request_canvas_state
```
- Umożliwia współpracę wielu użytkowników w czasie rzeczywistym

---

## 13. Skróty klawiszowe

| Skrót | Funkcja |
|-------|---------|
| Ctrl + Z | Cofnij |
| Ctrl + Y / Ctrl + Shift + Z | Ponów |
| E | Gumka |
| P | Pipeta |
| Delete / Backspace | Wyczyść canvas |
| + / - | Zmiana rozmiaru pędzla |

---

# Backend

## 1. Serwer Node.js + Express
```js
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Pixel Art Editor działa na http://localhost:${PORT}`);
});
```
- Serwer statycznych plików w katalogu `public`
- Endpoint główny `/` zwraca `index.html`
- Uruchomienie serwera na porcie 3000

---

## 2. Socket.IO – synchronizacja akcji
```js
io.on("connection", (socket) => {
  console.log("Użytkownik połączony:", socket.id);

  socket.on("draw_pixel", (data) => socket.broadcast.emit("draw_pixel", data));
  socket.on("clear_canvas", () => socket.broadcast.emit("clear_canvas"));
  socket.on("undo_action", (data) => socket.broadcast.emit("load_canvas_state", data));
  socket.on("redo_action", (data) => socket.broadcast.emit("load_canvas_state", data));
  socket.on("load_canvas_state", (data) => socket.broadcast.emit("load_canvas_state", data));
  socket.on("send_canvas_state", (data) => socket.broadcast.emit("load_canvas_state", data));
  socket.on("new_client_ready", () => socket.broadcast.emit("request_canvas_state"));

  socket.on("disconnect", () => console.log("Użytkownik rozłączony:", socket.id));
});
```
- Obsługuje wysyłanie akcji rysowania i stanu canvasu między klientami
- Synchronizuje cofanie/ponawianie oraz import obrazów
- Zapewnia nowym klientom pobranie aktualnego stanu

---

# Inicjalizacja aplikacji
```js
// Frontend
setCanvas();
socket.emit("new_client_ready");

// Backend
node server.js
```
- Inicjalizuje canvas
- Powiadamia serwer o nowym kliencie, aby pobrać aktualny stan
- Serwer nasłuchuje połączeń i synchronizuje akcje w czasie rzeczywistym
