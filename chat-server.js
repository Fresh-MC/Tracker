const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ----------------------------------
// Socket.IO setup with CORS
// ----------------------------------
const io = new Server(server, {
  cors: {
    origin: "*", // For development, allow all origins
    methods: ["GET", "POST"]
  }
});

// ----------------------------------
// Mock user data (pretend DB table)
// ----------------------------------
const mockUsers = [
  { id: 'u1', name: 'Sachin', email: 'fresh@example.com', role: 'Leader', bio: 'Hackathon mastermind' },
  { id: 'u2', name: 'Rajesh', email: 'ray@team.com', role: 'Dev', bio: 'Socket.IO ninja' },
  { id: 'u3', name: 'Sivakkumar', email: 'nova@team.com', role: 'UX Designer', bio: 'Figma wizard' }
];

// ----------------------------------
// In-memory chat history
// Nested structure:
// messageHistory[teamId][channelId] = [messages...]
// ----------------------------------
const messageHistory = {};  

// ----------------------------------
// Routes
// ----------------------------------

// Get mock users for sidebar/profile tooltips
app.get('/users', (req, res) => {
  res.json(mockUsers);
});

app.use(express.json());

// Example REST endpoint (not used by chat, just here for demonstration)
app.post('/api/send', (req, res) => {
  console.log('Received:', req.body.message);
  res.status(200).send('Message received');
});

// Serve static files (optional frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------
// Socket.IO Events
// ----------------------------------
io.on('connection', (socket) => {
  console.log('🔌 New client connected');

  /**
   * User joins a channel inside a team
   * roomKey is `teamId:channelId`
   */
  socket.on('joinRoom', ({ teamId, channelId }) => {
    const roomKey = `${teamId}:${channelId}`;
    socket.join(roomKey);
    console.log(`👥 ${socket.id} joined ${roomKey}`);

    // Ensure storage for team and channel
    if (!messageHistory[teamId]) messageHistory[teamId] = {};
    if (!messageHistory[teamId][channelId]) messageHistory[teamId][channelId] = [];

    // Send existing history to the newly joined user
    socket.emit('messageHistory', messageHistory[teamId][channelId]);
  });

  /**
   * When a user sends a message
   */
  socket.on('sendMessage', ({ teamId, channelId, senderEmail, content }) => {
    const user = mockUsers.find(u => u.email === senderEmail);
    const senderName = user ? user.name : senderEmail;

    const msg = {
      senderEmail,
      senderName,
      content,
      timestamp: new Date()
    };

    // Ensure nested arrays exist
    if (!messageHistory[teamId]) messageHistory[teamId] = {};
    if (!messageHistory[teamId][channelId]) messageHistory[teamId][channelId] = [];

    // Save message in the channel history
    messageHistory[teamId][channelId].push(msg);

    console.log(`📩 [${teamId}#${channelId}] ${senderName}: ${content}`);

    // Emit only to people in that specific channel
    io.to(`${teamId}:${channelId}`).emit('newMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ----------------------------------
// Server listen
// ----------------------------------
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});