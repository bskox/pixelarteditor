const express = require("express");
const path = require("path");

const app = express();

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Pixel Art Editor running at http://localhost:${PORT}`);
});
