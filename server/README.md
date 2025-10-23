# Tracker KPR - Backend Server

Professional Express.js + MongoDB backend for Tracker KPR project management application.

## 🚀 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (httpOnly cookies)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Validation**: Express Validator

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, error handling)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions (JWT, etc.)
│   └── server.js        # Main application entry point
├── .env                 # Environment variables
├── .gitignore
└── package.json
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Update `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tracker-kpr
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5175
```

### 3. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URI` with your MongoDB Atlas connection string.

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** (cloud):
- Create free cluster at https://www.mongodb.com/cloud/atlas
- Get connection string
- Update `MONGODB_URI` in `.env`

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on http://localhost:3000

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/me` | Get current user | Private |
| GET | `/api/auth/profile` | Get user profile | Private |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Manager/Admin |
| GET | `/api/users/:id` | Get single user | Private |
| PUT | `/api/users/:id` | Update user | Private |
| DELETE | `/api/users/:id` | Deactivate user | Admin |

### Tasks

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tasks` | Get all tasks | Private |
| POST | `/api/tasks` | Create task | Manager/Admin |
| GET | `/api/tasks/:id` | Get single task | Private |
| PUT | `/api/tasks/:id` | Update task | Private |
| DELETE | `/api/tasks/:id` | Delete task | Manager/Admin |
| POST | `/api/tasks/:id/comments` | Add comment | Private |

## 🔐 Authentication

### Registration Example

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Login Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Using Protected Routes

The JWT token is automatically stored in an httpOnly cookie. For API testing with tools like Postman:

1. Login to get token
2. Token is automatically sent in subsequent requests via cookie
3. Or manually add to Authorization header: `Bearer <token>`

## 🛡️ Security Features

- ✅ **Helmet**: Security headers
- ✅ **CORS**: Cross-origin configuration
- ✅ **Rate Limiting**: Prevent brute force attacks
- ✅ **JWT**: Secure token-based authentication
- ✅ **httpOnly Cookies**: XSS protection
- ✅ **Password Hashing**: bcrypt with salt
- ✅ **Input Validation**: Express validator
- ✅ **Error Handling**: Global error handler

## 🗄️ Database Models

### User Model
- username, email, password (hashed)
- role: user | manager | admin
- isActive, lastLogin, timestamps

### Task Model
- title, description, status, priority
- assignedTo, createdBy (User refs)
- dates: dueDate, startDate, completedAt
- estimatedHours, actualHours
- tags, dependencies, attachments, comments

### Message Model
- sender (User ref), content, room
- type: text | system | file
- isRead, readBy, attachments, replyTo

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api
```

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test1234"}'
```

## 🔄 Integration with Frontend

Update frontend environment variables:

```env
# frontend/.env
VITE_API_URL=http://localhost:3000
```

Frontend will connect to backend API automatically with CORS enabled.

## 📝 User Roles

- **user**: Can view/update own tasks
- **manager**: Can create/delete tasks, view all users
- **admin**: Full access to all resources

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- For Atlas: Check IP whitelist and credentials

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend port
- Ensure credentials are included in frontend fetch requests

## 📚 Next Steps

1. ✅ Backend structure created
2. ✅ Authentication implemented
3. ✅ Core models defined
4. 🔄 Connect frontend to backend API
5. 📝 Add file upload functionality
6. 💬 Implement real-time chat (Socket.IO)
7. 📊 Add analytics endpoints
8. 🧪 Write tests

---

## 🔥 Stage 6: Real-time Task Validation

### Validation Engine (Flask + Socket.IO)

Stage 6 adds automatic task validation via GitHub webhooks with real-time dashboard updates.

#### Quick Start with Ngrok

Expose your validation engine to GitHub webhooks:

```bash
# All-in-one startup (Flask + ngrok)
cd server
./start_with_ngrok.sh
```

This will:
- ✅ Start Flask validation engine on port 5002
- ✅ Start ngrok tunnel with public URL
- ✅ Display webhook URL for GitHub configuration
- ✅ Monitor and auto-restart both services

#### Manual Setup

**Option 1: Just ngrok manager**
```bash
# If Flask is already running
python3 ngrok_manager.py
```

**Option 2: Traditional approach**
```bash
# Terminal 1: Start Flask
python3 validation_engine.py

# Terminal 2: Start ngrok
ngrok http 5002
```

#### Available Scripts

| Script | Purpose |
|--------|---------|
| `validation_engine.py` | Flask + Socket.IO backend for webhooks |
| `ngrok_manager.py` | Ngrok tunnel manager with auto-restart |
| `start_with_ngrok.sh` | Unified launcher for both services |
| `test_stage6_validation.sh` | Comprehensive test suite |

#### Documentation

- **Comprehensive Guide**: `STAGE6_REALTIME_VALIDATION.md`
- **Ngrok Setup**: `NGROK_SETUP.md`
- **Validation Engine**: `VALIDATION_ENGINE_README.md`

#### Key Features

- 🔄 **Real-time Updates**: Socket.IO broadcasts to all dashboards
- ✅ **Auto-validation**: Tasks complete automatically on GitHub push
- 🔐 **RBAC Support**: Team-aware notifications
- 🌐 **Ngrok Integration**: Expose localhost to GitHub webhooks
- 📊 **Monitoring**: Health checks and auto-restart
- 🧪 **Testing**: Automated test suite included

---

**Author**: Tracker KPR Team  
**Version**: 1.0.0  
**License**: ISC
