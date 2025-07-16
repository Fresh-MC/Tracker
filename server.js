const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

// Middleware to parse JSON body from requests
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Dummy in-memory database (use MongoDB in real projects)
const users = [];

// Register route
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save the user
  users.push({ name, email, password: hashedPassword });
  res.status(201).json({ message: "User registered successfully" });
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(user => user.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // Generate JWT token
  const token = jwt.sign({ email: user.email }, "secretkey", { expiresIn: "1h" });
  res.status(200).json({ token });
});

// Serve intro.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "intro.html"));
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
