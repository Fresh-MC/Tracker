const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const mockUsers = [
  { id: 'u1', name: 'Sachin', email: 'fresh@example.com', role: 'Leader', bio: 'Hackathon mastermind' },
  { id: 'u2', name: 'Rajesh', email: 'ray@team.com', role: 'Dev', bio: 'Socket.IO ninja' },
  { id: 'u3', name: 'Sivakkumar', email: 'nova@team.com', role: 'UX Designer', bio: 'Figma wizard' }
];

app.get('/users', (req, res) => {
  res.json(mockUsers);
});

app.get('/users', (req, res) => {
  res.json(mockUsers);
});
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('🔌 New connection');

  socket.on('joinRoom', (teamId) => {
    socket.join(teamId);
    console.log(`👥 Joined room ${teamId}`);
  });

  socket.on('sendMessage', ({ teamId, senderEmail, content }) => {
    console.log(`📩 [${teamId}] ${senderEmail}: ${content}`);
    io.to(teamId).emit('newMessage', { senderEmail, content });
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
