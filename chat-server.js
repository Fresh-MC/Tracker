// chat-server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

// ----------------------------------
// Socket.IO setup with CORS
// ----------------------------------
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ----------------------------------
// Mock user data
// ----------------------------------
const mockUsers = [
  { id: 'u1', name: 'Sachin', email: 'fresh@example.com', role: 'Leader', bio: 'Hackathon mastermind' },
  { id: 'u2', name: 'Rajesh', email: 'ray@team.com', role: 'Dev', bio: 'Socket.IO ninja' },
  { id: 'u3', name: 'Sivakkumar', email: 'nova@team.com', role: 'UX Designer', bio: 'Figma wizard' }
];

// ----------------------------------
// In-memory chat history
// messageHistory[teamId][channelId] = [messages...]
// ----------------------------------
const messageHistory = {};

// ----------------------------------
// In-memory DH keys per room
// CHANNEL_KEYS[teamId:channelId][socketId] = { dh, publicKey }
// ----------------------------------
const CHANNEL_KEYS = {};

// ----------------------------------
// Routes
// ----------------------------------
app.get('/users', (req, res) => res.json(mockUsers));
app.use(express.json());
app.post('/api/send', (req, res) => {
  console.log('Received:', req.body.message);
  res.status(200).send('Message received');
});
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------
// Socket.IO Events
// ----------------------------------
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // ---------------- JOIN ROOM ----------------
  socket.on('joinRoom', ({ teamId, channelId, clientPublicKey }) => {
    const roomKey = `${teamId}:${channelId}`;
    socket.join(roomKey);
    console.log(`👥 ${socket.id} joined ${roomKey}`);

    // DH setup for this socket
    const dh = crypto.createDiffieHellman(2048);
    dh.generateKeys();
    const serverPublicKey = dh.getPublicKey('base64');

    if (!CHANNEL_KEYS[roomKey]) CHANNEL_KEYS[roomKey] = {};
    CHANNEL_KEYS[roomKey][socket.id] = { dh, publicKey: clientPublicKey };

    // Send server public key to client
    socket.emit('serverPublicKey', { serverPublicKey });

    // Send existing peers' public keys to this client
    const existingPeers = {};
    for (let peerId in CHANNEL_KEYS[roomKey]) {
      if (peerId !== socket.id) existingPeers[peerId] = CHANNEL_KEYS[roomKey][peerId].publicKey;
    }
    socket.emit('existingPeers', existingPeers);

    // Notify existing peers of this new peer
    socket.to(roomKey).emit('newPeer', { socketId: socket.id, publicKey: clientPublicKey });

    // Initialize in-memory message history
    if (!messageHistory[teamId]) messageHistory[teamId] = {};
    if (!messageHistory[teamId][channelId]) messageHistory[teamId][channelId] = [];

    // Send existing history to this client
    socket.emit('messageHistory', messageHistory[teamId][channelId]);
  });

  // ---------------- SEND MESSAGE ----------------
  // Inside socket.on("sendMessage")
socket.on('sendMessage', async ({ teamId, channelId, senderEmail, content, contentEncrypted, fileName }) => {
  try {
    const user = await User.findOne({ email: senderEmail });
    const senderName = user ? user.username : senderEmail;

    // Save to DB
    const msg = new Message({
      teamId,
      channelId,
      senderEmail,
      senderName,
      content,
      contentEncrypted: !!contentEncrypted,
      fileName: fileName || null,
      timestamp: new Date()
    });

    await msg.save();

    // Emit to room
    io.to(`${teamId}:${channelId}`).emit('newMessage', msg);

  } catch (err) {
    console.error("❌ Error sending message:", err);
  }
});


  // ---------------- DISCONNECT ----------------
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    for (const roomKey in CHANNEL_KEYS) delete CHANNEL_KEYS[roomKey][socket.id];
  });
});

// ----------------------------------
// Server listen
// ----------------------------------
const PORT = 4000;
server.listen(PORT, () => console.log(`✅ Server listening on http://localhost:${PORT}`));
