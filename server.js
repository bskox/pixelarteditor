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

io.on("connection", (socket) => {
  console.log("🟢 Użytkownik połączony:", socket.id);

  socket.on("draw_pixel", (data) => {
    socket.broadcast.emit("draw_pixel", data);
  });

  socket.on("clear_canvas", () => {
    socket.broadcast.emit("clear_canvas");
  });

  socket.on("undo", (imageData) => {
    socket.broadcast.emit("undo", imageData);
  });

  socket.on("redo", (imageData) => {
    socket.broadcast.emit("redo", imageData);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Użytkownik rozłączony:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Pixel Art Editor działa na http://localhost:${PORT}`);
});
