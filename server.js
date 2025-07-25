const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);  // New: create raw HTTP server
const { Server } = require('socket.io');
const io = new Server(server);         // New: initialize Socket.IO
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { verifyToken } = require('./middleware/verify.js'); // Import verify middleware
const { rootCertificates } = require('tls');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const users = [];
const messages = [];


// Socket.IO connection
io.on('connection', (socket) => {
  console.log('✅ A user connected');

  socket.on('joinRoom', (teamId) => {
    socket.join(teamId); // Join a specific team room
    console.log(`🔗 User joined room: ${teamId}`);
  });

  socket.on('sendMessage', (data) => {
    const { teamId, senderEmail, content } = data;

    if (!teamId || !senderEmail || !content) return;

    const msg = {
      senderEmail,
      teamId,
      content,
      timestamp: Date.now()
    };

    messages.push(msg);

    // Emit message to all users in that team room
    io.to(teamId).emit('newMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// Normal HTTP Routes...
//anyone can register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  // Validate input
  if (!name || !email || !password) {
  return res.status(400).json({ message: 'All fields are required' });
  }
  // Check if user already exists
  
  const existingUser = users.find(user => user.email === email);
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  // If this email is the manager's, auto-approve and assign role 'manager'
  const isManagerEmail = email === 'manager@example.com';

  users.push({ name, email, password: hashedPassword, role: isManagerEmail ? 'manager' : 'pending', approved: isManagerEmail ? true : false, });

  res.status(201).json({
    message: `User registered successfully${isManagerEmail ? ' as manager and approved' : ', pending approval'}`
  });
});
//manual approval for manager
const manager = users.find(u => u.email === 'manager@example.com');
if (manager) {
  manager.role = 'manager';
  manager.approved = true;
  console.log('Manager promoted:', manager.email);
}

//login endpoint
//user can login only if approved by manager
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(user => user.email === email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  if (!user.approved) {
    return res.status(403).json({ message: 'User not approved by manager' });
  }

  const token = jwt.sign({ email: user.email, role: user.role }, 'secretkey', { expiresIn: '1h' });
  res.status(200).json({ token, role: user.role });

});

// Manager approves users and sets their role
app.post('/api/auth/approve', verifyToken, (req, res) => {
  const { emailToApprove, role } = req.body;

  // Only managers can approve
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only managers can approve users' });
  }

  const user = users.find(u => u.email === emailToApprove);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const validRoles = ['member', 'teamlead'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  user.approved = true;
  user.role = role;

  res.status(200).json({ message: `${emailToApprove} approved as ${role}` });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
});

app.get('/api/chat/:teamId', (req, res) => {
  const teamId = req.params.teamId;
  const teamMessages = messages.filter(msg => msg.teamId === teamId);
  res.json(teamMessages);
});

// Start with raw server for socket.io
server.listen(3000, () => {
  console.log('Server + WebSocket running on port 3000');
});
// Task management endpoints
const tasks = [];

app.post('/api/tasks/create', verifyToken, (req, res) => {
  // Ensure user is authorized to create tasks
  if (req.user.role !== 'manager' && req.user.role !== 'teamlead') {
    return res.status(403).json({ message: 'Only managers or team leads can create tasks' });
  }
  const { title, assignedTo, dueat } = req.body;
  if (!title || !assignedTo || !dueat) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const newTask = {
    id: `task-${Date.now()}`,
    title,
    assignedTo,
    status: 'pending',
    dueat,
    delayReason: '',// 🆕 Initialize delay reason
    escalated: false // 🆕 Track if task is escalated
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

//update task endpoint
app.put('/api/tasks/:taskid',verifyToken, async (req, res) => {
  const { taskid } = req.params;
  const {status, delayReason } = req.body;

    // Validate: status is required
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  // If status is 'delayed', delayReason must be provided
  if (status === 'delayed' && (!delayReason || delayReason.trim() === '')) {
    return res.status(400).json({ message: 'Delay reason is required for delayed tasks' });
  }
  // Find the task
  const task = tasks.find(t => t.id === taskid);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Update task fields
  task.status = status;
  //Handle delayReason logic
  if (status === 'delayed') {
    task.delayReason = delayReason.trim();
  } else {
    task.delayReason = ''; // clear it if not delayed
  }

  res.status(200).json({ message: 'Task updated successfully', task });
});

// Get tasks based on user role
// Managers see all tasks, team leads see their team's tasks, members see their own tasks
app.get('/api/tasks', verifyToken, (req, res) => {
  const{ role ,email } = req.user;
  // Filter tasks based on user role  
  if (role === 'manager') {
    // Managers see all tasks
    return res.status(200).json(tasks);
  } 
  else if (role === 'teamlead') {
    // Team leads see tasks assigned to their team members
    const teamTasks = tasks.filter(task => task.assignedTo === email);
    return res.status(200).json(teamTasks); 
  }
  else if (role === 'member') { 
      // Members see only their own tasks
      const memberTasks = tasks.filter(task => task.assignedTo === email);
      return res.status(200).json(memberTasks);
    }
    
  // Unknown role fallback
  return res.status(403).json({ message: 'Unauthorized role' });
});

// Auto-mark tasks as delayed if overdue
// This runs every minute to check for overdue tasks
setInterval(() => {
  const now = Date.now();

  tasks.forEach(task => {
    const dueTime = new Date(task.dueat).getTime();

    // If task is overdue and not completed or already delayed
    if (
      task.status !== 'completed' &&now > dueTime && task.status !== 'delayed') {
      // Auto-mark as delayed if overdue
      task.status = 'delayed';
      task.delayReason = 'Auto-marked as delayed by system';
      console.log(`⚠️ Task ${task.id} marked as delayed`);
    }

    // If delayed for more than 1 hour, escalate
    if (
      task.status === 'delayed' && !task.escalated && now > dueTime + 60 * 60 * 1000 ) {
      // Escalate the task
      task.escalated = true;
      console.log(`🚨 Task ${task.id} escalated!`);
    }
  });
}, 60 * 1000); // every 1 minute 

// Manager updates task status and handles escalations
// Only manager can update escalated tasks
app.put('/api/tasks/update/:taskid', verifyToken, (req, res) => {

  const { taskid } = req.params;
  const { status, delayReason , dueat } = req.body;

  const task = tasks.find(t => t.id === taskid);
  if (!task) {  
    return res.status(404).json({ message: 'Task not found' });
  }
  // Only manager can update escalated tasks
  if (task.escalated && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only manager can modify escalated tasks' });
  }

  // Update fields if provided
  if (status) task.status = status;
  if (dueat) task.dueat = dueat;
  if (delayReason) task.delayReason = delayReason;

  // If manager is handling escalation manually, reset escalated flag
  if (req.user.role === 'manager') {
    task.escalated = false;
  }

  res.status(200).json({ message: 'Task updated by manager', task });
});

 





