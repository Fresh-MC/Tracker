// chat-server.js
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');

// Models
const Message = require('./models/message');
const User = require('./models/User');

// Config
const app = express();
app.use(express.json());
app.use(cors());

// HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ---------------------------
// MongoDB Atlas Connection
// ---------------------------
mongoose.connect('mongodb+srv://rajesh280208:4idNRZeoLqJiFSMT@cluster0.wixcv9j.mongodb.net/chatapp?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB Atlas connection error:", err));

// ---------------------------
// API Routes
// ---------------------------
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ---------------------------
// Socket.IO Events
// ---------------------------
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Number of messages to load
  const MESSAGE_LIMIT = 50;

  // Join a specific team/channel room
  socket.on('joinRoom', async ({ teamId, channelId }) => {
    const roomKey = `${teamId}:${channelId}`;
    socket.join(roomKey);
    console.log(`👥 ${socket.id} joined ${roomKey}`);

    try {
      // Fetch latest N messages from DB
      let messages = await Message.find({ teamId, channelId })
        .sort({ timestamp: -1 }) // latest first
        .limit(MESSAGE_LIMIT)
        .lean();

      // Reverse so UI shows oldest → newest
      messages = messages.reverse();

      socket.emit('messageHistory', messages);
    } catch (err) {
      console.error("❌ Failed to fetch messages:", err);
    }
  });

  // Send new message
  socket.on('sendMessage', async ({ teamId, channelId, senderEmail, content }) => {
    try {
      // Fetch username from DB
      const user = await User.findOne({ email: senderEmail });
      const senderName = user ? user.username : senderEmail;

      // Create and save message
      const msg = new Message({
        teamId,
        channelId,
        senderEmail,
        senderName,
        content
      });

      await msg.save();

      console.log(`📩 [${teamId}#${channelId}] ${senderName}: ${content}`);

      // Emit message to room
      io.to(`${teamId}:${channelId}`).emit('newMessage', msg);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ---------------------------
// Static files (optional frontend)
// ---------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------
// Start Server
// ---------------------------
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
