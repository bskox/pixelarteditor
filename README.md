# Dokumentacja projektu Pixel Art Editor

## Spis treści
1. [Opis projektu](#opis-projektu)
2. [Moduły i funkcjonalności](#moduły-i-funkcjonalności)
   - [1. Połączenie z serwerem](#1-połączenie-z-serwerem)
   - [2. Konfiguracja canvas oraz siatki](#2-konfiguracja-canvas-oraz-siatki)
   - [3. Rysowanie pikseli](#3-rysowanie-pikseli)
   - [4. Cofanie i ponawianie (Undo/Redo)](#4-cofanie-i-ponawianie-undoredo)
   - [5. Pipeta](#5-pipeta)
   - [6. Gumka](#6-gumka)
   - [7. Rozmiar pędzla](#7-rozmiar-pędzla)
   - [8. Zoom obszaru roboczego](#8-zoom-obszaru-roboczego)
   - [9. Zapisywanie do PNG](#9-zapisywanie-do-png)
   - [10. Wczytywanie obrazów](#10-wczytywanie-obrazu)
   - [11. Synchronizacja SocketIO](#11-synchronizacja-socketio)
   - [12. Skróty klawiszowe](#12-skróty-klawiszowe)
3. [Inicjalizacja aplikacji](#inicjalizacja-aplikacji)

---

## Opis projektu
Projekt jest edytorem pixel-art który pozwala użytkownikowi na wykorzystanie multum funkcji wspomagające tworzenie grafik pikselowych (Narzędzia takie jak : Gumka, Pipeta, Zmiana rozmiarów pędzla i inne)

---

## Moduły i funkcjonalności

### 1. Połączenie z serwerem
```js
const socket = io();
```
Nawiązuje połączenie z backendem i odpowiada za komunikację czasu rzeczywistego.

---

### 2. Konfiguracja canvas oraz siatki
```js
function setCanvas()
function drawGrid()
```
- Tworzy element canvas o zadanych wymiarach (`gridWidth`, `gridHeight`, `pixelSize`)
- Rysuje siatkę na oddzielnym płótnie

---

### 3. Rysowanie pikseli
```js
function drawPixel(x, y, emit=true, color=null, size=brushSize)
```
- Rysuje piksele o aktualnym kolorze i rozmiarze pędzla
- Obsługuje gumkę i shading koloru
- Może emitować akcję do innych użytkowników (collab)

---

### 4. Cofanie i ponawianie (Undo/Redo)
```js
function saveState()
function undo(emit=true)
function redo(emit=true)
```
- Stan przechowywany w `undoStack` i `redoStack`
- Przesyła zmiany między klientami przez socket

---

### 5. Pipeta
Pobiera kolor z płótna na podstawie pozycji kursora przy kliknięciu.

---

### 6. Gumka
Włącza tryb kasowania pikseli. Dezaktywuje pipetę w przypadku kolizji trybów.

---

### 7. Rozmiar pędzla
Zakres regulacji 1–10. Zmiana wpływa na ilość pikseli rysowanych jednocześnie.

---

### 8. Zoom obszaru roboczego
```js
applyZoom()
```
Skalowanie widoku canvasu CSS-em, obsługa przyciskami oraz kółkiem myszy.

---

### 9. Zapisywanie do PNG
```js
saveBtn.addEventListener('click', ...)
```
Eksportuje aktualny projekt jako obraz PNG.

---

### 10. Wczytywanie obrazu
Możliwość importu grafiki. W przypadku obrazów z edytora zachowane metadane pikselowe.

---

### 11. Synchronizacja SocketIO
Kanały obsługiwane przez aplikację:

```
draw_pixel
clear_canvas
undo_action
redo_action
load_canvas_state
send_canvas_state
request_canvas_state
```

---

### 12. Skróty klawiszowe

| Skrót | Działanie |
|------|-----------|
| Ctrl + Z | Cofnij |
| Ctrl + Y / Ctrl + Shift + Z | Ponów |
| E | Gumka |
| P | Pipeta |
| Delete / Backspace | Czyszczenie canvasu |
| + / - | Zmiana rozmiaru pędzla |

---

## Inicjalizacja aplikacji
```js
setCanvas();
socket.emit("new_client_ready");
```

