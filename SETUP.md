# 🚀 Tracker KPR - Complete Setup Guide

## Overview

This project consists of:
- **Frontend**: React + Vite (Port 5175)
- **Backend**: Express.js + MongoDB (Port 3000)

---

## 📦 Quick Start (2 Options)

### Option 1: Standalone Frontend (Demo Mode - No Database Required)

**Current Status**: ✅ Already configured and running!

The frontend is currently running in **standalone mode** with:
- No backend dependencies
- Mock authentication (stores to localStorage)
- All pages accessible without login
- Perfect for UI/UX development

**Access**: http://localhost:5175/

### Option 2: Full Stack (Frontend + Backend with Database)

Follow the steps below to connect the real backend.

---

## 🔧 Backend Setup (Express + MongoDB)

### Step 1: Install MongoDB

**macOS (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify it's running
mongosh
```

**Alternative: Use MongoDB Atlas (Cloud - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string
4. Update `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tracker-kpr
   ```

### Step 2: Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
═══════════════════════════════════════════
🚀 Server running in development mode
📡 Port: 3000
🌐 API: http://localhost:3000/api
🔐 Auth: http://localhost:3000/api/auth
═══════════════════════════════════════════
✅ MongoDB Connected: localhost
📊 Database: tracker-kpr
```

### Step 3: Test Backend API

```bash
# Health check
curl http://localhost:3000/api

# Create test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@test.com",
    "password": "admin1234",
    "role": "admin"
  }'
```

---

## 🔄 Connect Frontend to Backend

### Step 1: Update Frontend to Use Real Backend

Edit `frontend/src/pages/AnimatedLogin.jsx`:

**Replace mock login** (lines ~125-145) with real API call:

```javascript
// Handle login - Real backend version
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  
  if (!isValidEmail(loginData.email)) {
    setError('Please enter a valid email address.');
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loginData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store user data
    localStorage.setItem('demoUser', JSON.stringify(data.user));
    
    setLoading(false);
    navigate('/dashboard');
  } catch (err) {
    setError(err.message || 'Network error. Please make sure the server is running.');
    console.error('Login error:', err);
    setLoading(false);
  }
};
```

### Step 2: Update Other Components

Apply similar changes to:
- `Navbar.jsx` - Fetch profile from `/api/auth/profile`
- `DashboardCards.jsx` - Fetch tasks from `/api/tasks`
- `Taskes.jsx` - Fetch users and tasks from `/api/users` and `/api/tasks`

### Step 3: Restart Frontend

```bash
cd frontend
npm run dev
```

---

## 📁 Project Structure

```
Tracker KPR/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Login, Dashboard, Profile, etc.
│   │   ├── components/   # Reusable UI components
│   │   └── main.jsx      # Entry point
│   ├── .env              # Environment variables
│   └── package.json
│
├── server/               # Express.js backend
│   ├── src/
│   │   ├── models/       # User, Task, Message schemas
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, error handling
│   │   ├── config/       # Database connection
│   │   └── server.js     # Main entry point
│   ├── .env              # Backend configuration
│   └── package.json
│
└── README.md             # This file
```

---

## 🧪 Testing the Full Stack

### 1. Register New User

**Frontend**: http://localhost:5175/ → Sign Up tab
- Username: `testuser`
- Email: `test@test.com`
- Password: `test1234`
- Role: `user`

**Or via API**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"test1234"}'
```

### 2. Login

**Frontend**: http://localhost:5175/ → Sign In tab
- Email: `test@test.com`
- Password: `test1234`

### 3. Test Protected Routes

After login, you should be able to access:
- `/dashboard` - Main dashboard
- `/profile` - User profile
- `/chat` - Chat (UI only, WebSocket TBD)
- `/project-plan` - Project planning
- `/team` - Team dashboard (admin/manager only)

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/profile` - Get profile (alias)

### Users
- `GET /api/users` - List users (manager/admin)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (admin)

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task (manager/admin)
- `GET /api/tasks/:id` - Get task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (manager/admin)
- `POST /api/tasks/:id/comments` - Add comment

---

## 🛠️ Troubleshooting

### Frontend Port Already in Use
```bash
# Frontend auto-switches to next available port (5175, 5176, etc.)
# Check terminal output for actual port
```

### Backend Port 3000 in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill

# Or change port in server/.env
PORT=4000
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community@7.0

# Or use MongoDB Atlas (cloud) - see Backend Setup
```

### CORS Errors
- Ensure `FRONTEND_URL` in `server/.env` matches your frontend port
- Ensure `credentials: 'include'` in frontend fetch calls
- Check browser console for specific error

### "useAuth must be used within AuthProvider" Error
✅ Already fixed! This was resolved by removing AuthProvider in standalone mode.

To re-enable authentication:
1. Restore AuthProvider in `main.jsx`
2. Update AnimatedLogin to use real API (see Step 1 above)
3. Update ProtectedRoute to check real auth state

---

## 📚 Development Workflow

### Current: Standalone Frontend (Stage 1)
```bash
# Terminal 1: Frontend only
cd frontend && npm run dev
# Access: http://localhost:5175
```

### Full Stack (Stage 2)
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 🎯 Next Steps

- [ ] Install MongoDB or configure Atlas
- [ ] Start backend server
- [ ] Connect frontend to backend API
- [ ] Test authentication flow
- [ ] Implement real-time chat with Socket.IO
- [ ] Add file upload functionality
- [ ] Implement task management features
- [ ] Add team collaboration features

---

## 📝 Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_CHAT_URL=http://localhost:4000  # For future WebSocket
```

### Backend (`server/.env`)
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tracker-kpr
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5175
```

---

## ✅ Current Status

- ✅ Legacy backend removed
- ✅ New professional backend created (Express + MongoDB)
- ✅ Frontend running standalone (port 5175)
- ✅ Backend structure complete (port 3000)
- ✅ Authentication system implemented (JWT)
- ✅ Security middleware configured
- ✅ API endpoints ready
- ⏳ MongoDB connection (install required)
- ⏳ Frontend-backend integration (optional)

---

**Version**: 2.0.0  
**Last Updated**: October 23, 2025
