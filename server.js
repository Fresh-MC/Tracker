const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");
const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/message');
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const Proof = require("./models/proof");
const taskRoutes = require('./routes/taskRoutes');

const SECRET = "your_jwt_secret"; // Use a strong secret in production
const PORT = 3000;

// ====== CONNECT MONGODB ======
mongoose.connect('mongodb+srv://rajesh280208:4idNRZeoLqJiFSMT@cluster0.wixcv9j.mongodb.net/trackerdemo?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas connected'))
.catch((err) => console.error('❌ MongoDB Atlas connection error:', err));

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // your React frontend
  credentials: true
}));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== REUSABLE AUTH MIDDLEWARE ======
function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token, not authorized" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // makes decoded data available in route
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ====== ROUTES ======

// Serve intro.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "intro.html"));
});

// Tasks route
app.use('/api/tasks', taskRoutes);

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username: name, email, password: hashedPassword, role });
  await newUser.save();

  res.status(201).json({ message: "User registered successfully" });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, email: user.email, username: user.username, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // set to true in production
    sameSite: "lax",
    maxAge: 60 * 60 * 1000
  });

  res.status(200).json({
    message: "Login successful",
    user: { username: user.username, role: user.role, email: user.email }
  });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // set to true in production
    sameSite: "lax"
  });
  res.json({ message: "Logged out successfully" });
});

// Protected profile route
app.get("/api/profile", auth, (req, res) => {
  res.json({ user: req.user });
});

// Progress (example public route)
app.get("/api/progress", async (req, res) => {
  const userProgress = { completed: 45, total: 100 };
  res.json(userProgress);
});

// File upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const { taskId } = req.body;
  const file = req.file;
  const proof = new Proof({
    taskId,
    filename: file.filename,
    originalname: file.originalname,
    path: file.path,
  });
  await proof.save();
  res.json({ message: "File uploaded", file: proof });
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "username role");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`🔵 Express server running at http://localhost:${PORT}`);
});
