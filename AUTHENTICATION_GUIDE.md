# 🔐 Complete Authentication System Guide

## Overview

This MERN stack application features a **complete, production-ready authentication system** with JWT-based authentication, role-based access control, and secure password management.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Security Features](#security-features)
5. [Testing the System](#testing-the-system)
6. [API Endpoints](#api-endpoints)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

### Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT (JSON Web Tokens)
- bcryptjs (password hashing)
- Cookie-parser (httpOnly cookies)

**Frontend:**
- React 18 + Vite
- React Router v6
- Context API (AuthContext)
- GSAP (animations)

### Authentication Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │      │   Express   │      │   MongoDB   │
│  (React)    │      │   Backend   │      │  Database   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                     │
       │  POST /api/auth/   │                     │
       │  register/login    │                     │
       ├───────────────────>│                     │
       │                    │  Find user +        │
       │                    │  verify password    │
       │                    ├────────────────────>│
       │                    │<────────────────────┤
       │                    │                     │
       │    JWT Token +     │                     │
       │    User Data       │                     │
       │<───────────────────┤                     │
       │                    │                     │
       │  Store in          │                     │
       │  localStorage +    │                     │
       │  Cookie            │                     │
       │                    │                     │
       │  Protected API     │                     │
       │  Request + Token   │                     │
       ├───────────────────>│                     │
       │                    │  Verify JWT         │
       │                    │  Check user role    │
       │                    ├────────────────────>│
       │                    │<────────────────────┤
       │    Response        │                     │
       │<───────────────────┤                     │
```

---

## 🔧 Backend Implementation

### 1. User Model (`/server/src/models/User.js`)

**Schema Fields:**
- `username` - Unique, 3-30 characters
- `email` - Unique, validated format
- `password` - Hashed with bcrypt (min 8 chars)
- `role` - Enum: `user`, `manager`, `admin`
- `profilePicture` - Optional URL
- `isActive` - Boolean (for soft delete)
- `lastLogin` - Timestamp
- `createdAt`, `updatedAt` - Auto-timestamps

**Key Features:**
- Pre-save hook: Auto-hash passwords with bcrypt (10 salt rounds)
- `comparePassword(candidatePassword)` - Verify login credentials
- `toPublicJSON()` - Return safe user data (no password)

### 2. Authentication Controller (`/server/src/controllers/authController.js`)

**Endpoints:**

#### `POST /api/auth/register`
- Validates username, email, password
- Checks for existing users
- Hashes password with bcrypt
- Creates user in MongoDB
- Generates JWT token
- Sends token in httpOnly cookie + response
- Returns user data (no password)

#### `POST /api/auth/login`
- Validates email and password
- Finds user in database
- Compares password hash
- Checks account status (isActive)
- Updates lastLogin timestamp
- Generates JWT token
- Returns token + user data

#### `POST /api/auth/logout`
- Clears httpOnly cookie
- Returns success message

#### `GET /api/auth/me`
- Requires authentication
- Returns current user profile

### 3. Authentication Middleware

#### File: `/server/src/middleware/authenticateToken.js`

**`authenticateToken(req, res, next)`**
- Reads token from Authorization header (`Bearer <token>`) or cookies
- Verifies JWT signature and expiration
- Fetches user from database
- Checks user existence and active status
- Attaches user to `req.user`
- Returns 401 if unauthorized

**`requireRole(...roles)`**
- Must be used AFTER `authenticateToken`
- Checks if `req.user.role` matches allowed roles
- Returns 403 if insufficient permissions

**Usage Examples:**
```javascript
// All authenticated users
router.get('/profile', authenticateToken, getProfile);

// Admin only
router.delete('/users/:id', authenticateToken, requireRole('admin'), deleteUser);

// Manager or Admin
router.get('/team', authenticateToken, requireRole('manager', 'admin'), getTeam);
```

### 4. JWT Utilities (`/server/src/utils/jwt.js`)

- `generateToken(payload)` - Create JWT with user ID
- `verifyToken(token)` - Validate and decode JWT
- `sendTokenCookie(res, token)` - Set httpOnly cookie (7 days)
- `clearTokenCookie(res)` - Remove authentication cookie

### 5. Environment Variables (`.env`)

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Frontend CORS
FRONTEND_URL=http://localhost:5174
```

---

## 🎨 Frontend Implementation

### 1. AuthContext (`/frontend/src/context/AuthContext.jsx`)

**Global Authentication State:**

```javascript
const { 
  user,              // Current user object
  token,             // JWT token
  loading,           // Loading state
  isAuthenticated,   // Boolean
  apiUrl,            // Backend URL from .env
  login,             // Function to login
  logout,            // Function to logout
  checkAuth,         // Verify auth status
  updateUser         // Update user data
} = useAuth();
```

**Features:**
- Stores user + token in localStorage
- Auto-checks authentication on page load
- Verifies token with backend (`/api/auth/me`)
- Provides global auth state to all components

### 2. AnimatedLogin Component (`/frontend/src/pages/AnimatedLogin.jsx`)

**Features:**
- Beautiful GSAP animations (preserved from original)
- Login & Register tabs
- Backend integration with fetch API
- Email validation (regex)
- Password length validation (min 8 chars)
- Error handling and display
- Loading states
- Automatic redirect after login
- httpOnly cookie + localStorage token storage

**Login Flow:**
1. User enters email + password
2. Frontend validates input
3. Sends POST request to `/api/auth/login`
4. Backend validates credentials and returns JWT
5. Frontend stores token + user in AuthContext
6. Redirects to `/dashboard`

**Register Flow:**
1. User enters username, email, password, confirm password, role
2. Frontend validates all fields
3. Sends POST request to `/api/auth/register`
4. Backend creates user and returns JWT
5. Frontend stores token + user
6. Redirects to `/dashboard`

### 3. ProtectedRoute Component (`/frontend/src/components/ProtectedRoute.jsx`)

**Purpose:** Wrap protected pages to require authentication

**Features:**
- Checks `isAuthenticated` from AuthContext
- Shows loading spinner during auth check
- Redirects to login if not authenticated
- **Role-Based Access Control (RBAC)**
- Beautiful access denied UI
- Saves attempted route for redirect after login

**Usage:**
```jsx
// All authenticated users
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Manager and Admin only
<Route path="/team" element={
  <ProtectedRoute allowedRoles={['manager', 'admin']}>
    <TeamDashboard />
  </ProtectedRoute>
} />
```

### 4. App Router (`/frontend/src/App.jsx`)

**Route Configuration:**

| Route | Access Level | Allowed Roles |
|-------|-------------|---------------|
| `/` | Public | All |
| `/about` | Public | All |
| `/contact` | Public | All |
| `/dashboard` | Protected | All authenticated |
| `/profile` | Protected | All authenticated |
| `/chat` | Protected | All authenticated |
| `/project-plan` | Protected | All authenticated |
| `/team` | Protected | `manager`, `admin` |

### 5. Environment Configuration (`.env`)

```bash
# Backend API
VITE_API_URL=http://localhost:3000

# Chat Server
VITE_CHAT_URL=http://localhost:4000

# App Info
VITE_APP_NAME=Tracker KPR
VITE_APP_VERSION=1.0.0
```

---

## 🔒 Security Features

### Password Security
✅ **Bcrypt hashing** - 10 salt rounds  
✅ **Minimum 8 characters** - Frontend + backend validation  
✅ **Password never stored in plain text**  
✅ **Password excluded from API responses** - `select: false` in schema

### Token Security
✅ **JWT with strong secret** - From environment variable  
✅ **7-day expiration** - Configurable  
✅ **httpOnly cookies** - Cannot be accessed by JavaScript  
✅ **Token verification on every request** - Middleware checks  
✅ **Automatic token cleanup on logout**

### API Security
✅ **CORS configured** - Only frontend URL allowed  
✅ **Helmet headers** - XSS protection, etc.  
✅ **Rate limiting** - 100 requests per 15 minutes  
✅ **Input validation** - Email format, password length  
✅ **Role-based access control** - Admin, manager, user roles

### Database Security
✅ **Mongoose validation** - Schema-level constraints  
✅ **Unique constraints** - Username and email  
✅ **Soft delete** - `isActive` flag instead of hard delete  
✅ **Account status checks** - Deactivated users cannot login

---

## 🧪 Testing the System

### 1. Start Backend Server

```bash
cd server
npm run dev
```

**Expected Output:**
```
═══════════════════════════════════════════
🚀 Server running in development mode
📡 Port: 3000
🌐 API: http://localhost:3000/api
🔐 Auth: http://localhost:3000/api/auth
═══════════════════════════════════════════

✅ MongoDB Connected: cluster0.mongodb.net
📊 Database: trackerdemo
```

### 2. Start Frontend Server

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v7.0.4  ready in 478 ms

➜  Local:   http://localhost:5174/
```

### 3. Test User Registration (via curl)

```bash
# Create a regular user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-23T..."
  }
}
```

### 4. Test User Login (via curl)

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "lastLogin": "2025-10-23T..."
  }
}
```

### 5. Test Protected Route (via curl)

```bash
# Get current user profile (requires token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "_id": "67890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 6. Test Frontend Registration

1. Open browser: `http://localhost:5174`
2. Click **"Sign Up"** tab
3. Fill in form:
   - Username: `testuser`
   - Email: `test@test.com`
   - Password: `test1234`
   - Confirm Password: `test1234`
   - Role: `User`
4. Click **"Register"**
5. Should redirect to `/dashboard`

### 7. Test Frontend Login

1. Open browser: `http://localhost:5174`
2. Click **"Sign In"** tab (default)
3. Fill in form:
   - Email: `test@test.com`
   - Password: `test1234`
4. Click **"Login"**
5. Should redirect to `/dashboard`

### 8. Test Protected Routes

**Try accessing protected route without login:**
1. Logout or clear localStorage
2. Navigate to `http://localhost:5174/dashboard`
3. Should redirect to `/` (login page)

**Try accessing role-restricted route:**
1. Login as regular user (`role: 'user'`)
2. Navigate to `http://localhost:5174/team`
3. Should show "Access Denied" page (requires manager/admin)

### 9. Test Role-Based Access

```bash
# Create manager user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager",
    "email": "manager@test.com",
    "password": "manager123",
    "role": "manager"
  }'

# Create admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@test.com",
    "password": "admin12345",
    "role": "admin"
  }'
```

Then login with manager/admin and access `/team` route successfully.

---

## 📚 API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | `/api/auth/logout` | Logout user | Any |
| GET | `/api/auth/me` | Get current user | Any |
| GET | `/api/auth/profile` | Get user profile | Any |
| GET | `/api/tasks` | List tasks | Any |
| POST | `/api/tasks` | Create task | Manager, Admin |
| GET | `/api/tasks/:id` | Get task | Any |
| PUT | `/api/tasks/:id` | Update task | Any |
| DELETE | `/api/tasks/:id` | Delete task | Manager, Admin |
| POST | `/api/tasks/:id/comments` | Add comment | Any |
| GET | `/api/users` | List users | Manager, Admin |
| GET | `/api/users/:id` | Get user | Any |
| PUT | `/api/users/:id` | Update user | Owner or Admin |
| DELETE | `/api/users/:id` | Deactivate user | Admin |

---

## 🐛 Troubleshooting

### Issue: "useAuth must be used within AuthProvider"

**Cause:** Component using `useAuth()` is not wrapped in `<AuthProvider>`

**Solution:** 
```jsx
// main.jsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Issue: CORS errors in browser console

**Cause:** Backend CORS not configured for frontend URL

**Solution:** Update `server/.env`:
```bash
FRONTEND_URL=http://localhost:5174
```

### Issue: "Invalid or expired token"

**Cause:** Token expired or JWT_SECRET changed

**Solution:**
1. Logout and login again
2. Clear localStorage
3. Check JWT_SECRET is same in `.env`

### Issue: "Email already registered"

**Cause:** User already exists in database

**Solution:**
1. Use different email
2. Or login with existing credentials
3. Or delete user from MongoDB

### Issue: MongoDB connection failed

**Cause:** Invalid MONGODB_URI or network issue

**Solution:**
1. Check `.env` file has correct connection string
2. Verify MongoDB Atlas IP whitelist includes your IP
3. Test connection with MongoDB Compass

### Issue: "Access Denied" for team page

**Cause:** User role is not `manager` or `admin`

**Solution:**
1. Register new user with `role: 'manager'` or `role: 'admin'`
2. Or update existing user role in MongoDB

### Issue: Port 3000 already in use

**Cause:** Another process using port 3000

**Solution:**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=4000
```

---

## 🎯 Key Takeaways

✅ **Complete authentication system** with JWT  
✅ **Role-based access control** (user, manager, admin)  
✅ **Secure password hashing** with bcrypt  
✅ **httpOnly cookies** for token storage  
✅ **Frontend AuthContext** for global state  
✅ **ProtectedRoute** for route guarding  
✅ **Beautiful UI** with GSAP animations  
✅ **Production-ready** security features  
✅ **MongoDB validation** and constraints  
✅ **Comprehensive error handling**

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review code comments in files
3. Check browser console for errors
4. Check backend terminal for logs
5. Verify MongoDB connection

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0  
**Stack:** MERN (MongoDB + Express + React + Node.js)
