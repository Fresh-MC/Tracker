// server.js

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors"); // <--- IMPORT CORS HERE

// Port
const PORT = 3000;

// Dummy in-memory database (replace with MongoDB in real use)
const users = [];

// Middleware
app.use(express.json()); // Parse JSON body
app.use(cors()); // <--- USE CORS MIDDLEWARE HERE (before your routes)
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (intro.html, bg.js, etc.)

// ======= Routes =======

// Serve intro.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "intro.html"));
});

// Register route
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find(user => user.email === email);
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashedPassword });

  res.status(201).json({ message: "User registered successfully" });
});

app.get("/api/progress", async (req, res) => {
  const userProgress = { completed: 45, total: 100 }; // Replace with real DB values later
  res.json(userProgress);
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(user => user.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email }, "secretkey", { expiresIn: "1h" });
  res.status(200).json({ token });
});

// =======================

// Start the server
app.listen(PORT, () => {
  console.log(`🔵 Express server running at http://localhost:${PORT}`);
});