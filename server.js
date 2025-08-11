// server.js

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors"); // <--- IMPORT CORS HERE
const mongoose = require('mongoose');
const User = require('./models/User');
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // or your preferred config
const Proof = require("./models/proof"); // adjust path if needed

const SECRET = "your_jwt_secret"; // Use a strong secret in production

// Port
const PORT = 3000;

// Dummy in-memory database (replace with MongoDB in real use)
const users = [];

// Connect to MongoDB Atlas Cluster
mongoose.connect('mongodb+srv://rajesh280208:4idNRZeoLqJiFSMT@cluster0.wixcv9j.mongodb.net/trackerdemo?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas connected'))
.catch((err) => console.error('❌ MongoDB Atlas connection error:', err));

// Middleware
app.use(express.json()); // Parse JSON body
app.use(cors({
  origin: "http://localhost:5173", // your React frontend URL
  credentials: true
})); // <--- USE CORS MIDDLEWARE HERE (before your routes)
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (intro.html, bg.js, etc.)
app.use(cookieParser()); // Parse cookies
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// ======= Routes =======

// Serve intro.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "intro.html"));
});

// Register route
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username: name, email, password: hashedPassword, role });
  await newUser.save();

  res.status(201).json({ message: "User registered successfully" });
});

app.get("/api/progress", async (req, res) => {
  const userProgress = { completed: 45, total: 100 }; // Replace with real DB values later
  res.json(userProgress);
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { email: user.email, username: user.username, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // set to true in production with HTTPS
    sameSite: "lax"
  });

  res.status(200).json({
    message: "Login successful",
    user: {
      username: user.username,
      role: user.role,
      email: user.email
    }
  });
});

app.get("/api/profile", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = jwt.verify(token, SECRET);
    res.json({ user });
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
});

// File upload route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const { taskId } = req.body;
  const file = req.file;
  const proof = new Proof({
    taskId,
    filename: file.filename,
    originalname: file.originalname,
    path: file.path,
    // uploadedBy: req.user or from JWT
  });
  await proof.save();
  res.json({ message: "File uploaded", file: proof });
});

// =======================

// Start the server
app.listen(PORT, () => {
  console.log(`🔵 Express server running at http://localhost:${PORT}`);
});

