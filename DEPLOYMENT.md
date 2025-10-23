# 🚀 Tracker KPR - Deployment Guide

## 📁 Repository Structure

```
Tracker KPR/
├── backend/                    # Node.js/Express backend
│   ├── config/                # Database & configuration
│   ├── middleware/            # Auth, RBAC, error handlers
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── utils/                 # Logger & helpers
│   ├── uploads/               # File uploads directory
│   ├── logs/                  # Application logs
│   ├── server.js              # Main API server
│   ├── chat-server.js         # WebSocket server
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables (local)
│   ├── .env.example           # Environment template
│   └── .gitignore
│
├── frontend/                  # React/Vite frontend
│   ├── src/                   # React components & pages
│   ├── public/                # Static assets
│   ├── dist/                  # Build output (generated)
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── .env                   # Environment variables (local)
│   ├── .env.example           # Environment template
│   └── .gitignore
│
├── render.yaml                # Render deployment config
├── DEPLOYMENT.md              # This file
└── README.md                  # Project README
```

---

## 🔧 Local Development Setup

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB Atlas** account (or local MongoDB)
- **Git**

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/Fresh-MC/Tracker.git
cd Tracker\ KPR

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your values:

```env
# Critical - MUST CHANGE
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/trackerdemo
JWT_SECRET=<generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# Optional - Use defaults or customize
NODE_ENV=development
PORT=3000
CHAT_PORT=4000
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_CHAT_URL=http://localhost:4000
```

### Step 3: Run Development Servers

#### Terminal 1 - API Server
```bash
cd backend
npm run dev
```

#### Terminal 2 - Chat Server
```bash
cd backend
npm run dev:chat
```

#### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- API: http://localhost:3000/api/health
- Chat: http://localhost:4000/health

---

## 🌐 Render.com Deployment

### Prerequisites
1. GitHub account with repository pushed
2. Render.com account (free tier available)
3. MongoDB Atlas cluster

### Deployment Steps

#### Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free M0 tier available)
3. Create database user with password
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere) for Render
5. Get connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/trackerdemo`

#### Step 2: Push to GitHub

```bash
# Ensure all changes are committed
git add .
git commit -m "Restructure for Render deployment"
git push origin main
```

#### Step 3: Deploy on Render

1. **Login to Render.com** and connect your GitHub account

2. **Create Blueprint Instance**
   - Go to Dashboard → "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`
   - Click "Apply"

3. **Set Secret Environment Variables** (for each backend service)
   
   Go to each service → Environment → Add Environment Variables:
   
   **For `tracker-kpr-api`:**
   ```
   MONGODB_URI = <your_mongodb_atlas_connection_string>
   ```
   
   **For `tracker-kpr-chat`:**
   ```
   MONGODB_URI = <same_as_above>
   JWT_SECRET = <copy from tracker-kpr-api after it's auto-generated>
   ```

4. **Update Cross-Service URLs**

   After deployment, you'll get URLs like:
   - API: `https://tracker-kpr-api.onrender.com`
   - Chat: `https://tracker-kpr-chat.onrender.com`
   - Frontend: `https://tracker-kpr-frontend.onrender.com`

   **Update these services:**

   **API Service (`tracker-kpr-api`):**
   - Environment → `FRONTEND_URL` = `https://tracker-kpr-frontend.onrender.com`

   **Chat Service (`tracker-kpr-chat`):**
   - Environment → `FRONTEND_URL` = `https://tracker-kpr-frontend.onrender.com`

   **Frontend Service (`tracker-kpr-frontend`):**
   - Environment → `VITE_API_URL` = `https://tracker-kpr-api.onrender.com`
   - Environment → `VITE_CHAT_URL` = `https://tracker-kpr-chat.onrender.com`

5. **Redeploy** all services after updating URLs:
   - Manual Deploy → "Deploy Latest Commit"

#### Step 4: Verify Deployment

- Visit your frontend URL: `https://tracker-kpr-frontend.onrender.com`
- Check API health: `https://tracker-kpr-api.onrender.com/api/health`
- Check Chat health: `https://tracker-kpr-chat.onrender.com/health`

---

## 🔒 Security Checklist for Production

### Before Going Live:

- [ ] **Rotate all secrets** (JWT_SECRET, MONGODB_URI password)
- [ ] **Update CORS origins** to specific frontend domains (no wildcards)
- [ ] **Enable HTTPS only** (Render provides this automatically)
- [ ] **Set secure cookies**: `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`
- [ ] **Review rate limits** (adjust based on expected traffic)
- [ ] **Set up error monitoring** (Sentry, LogRocket, etc.)
- [ ] **Configure MongoDB backups** (Atlas provides automated backups)
- [ ] **Add custom domain** (optional, via Render settings)
- [ ] **Set up health monitoring** (Render provides basic monitoring)
- [ ] **Review file upload limits** and storage strategy

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Authentication error: Token required"
- **Cause**: Frontend not sending auth token to WebSocket
- **Fix**: Ensure token is stored in cookie after login

#### 2. "CORS policy blocked"
- **Cause**: Frontend URL not in `FRONTEND_URL` environment variable
- **Fix**: Update `FRONTEND_URL` in backend services to include your frontend domain

#### 3. "MongoDB connection failed"
- **Cause**: Wrong connection string or IP not whitelisted
- **Fix**: 
  - Verify `MONGODB_URI` is correct
  - Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access

#### 4. "502 Bad Gateway" on Render
- **Cause**: Service failed to start or health check failing
- **Fix**: 
  - Check service logs in Render dashboard
  - Verify all required environment variables are set
  - Check health check endpoints return 200 OK

#### 5. Frontend shows "Failed to fetch"
- **Cause**: API URL incorrect or CORS issue
- **Fix**:
  - Verify `VITE_API_URL` in frontend environment
  - Check browser console for detailed error
  - Verify backend CORS allows frontend origin

### Checking Logs

**Render Dashboard:**
- Go to service → "Logs" tab
- Filter by time range
- Search for errors

**Local Development:**
- Backend logs: `backend/logs/combined.log`
- Error logs: `backend/logs/error.log`

---

## 📊 Performance Optimization

### For Production:

1. **Upgrade to Render Starter Plan** ($7/month) for:
   - No spin-down (faster response times)
   - More resources
   - Better reliability

2. **Enable Caching**:
   - Add Redis for session storage
   - Cache frequently accessed data

3. **Optimize Database Queries**:
   - Add indexes on frequently queried fields
   - Use projection to limit returned fields

4. **CDN for Frontend**:
   - Render serves static files via CDN automatically
   - Consider Cloudflare for additional optimization

5. **Compress Images**:
   - Implement image compression on upload
   - Use WebP format where possible

---

## 🔄 CI/CD Pipeline

Render automatically:
- ✅ Builds on every push to `main` branch
- ✅ Runs build commands
- ✅ Deploys if build succeeds
- ✅ Rolls back if health checks fail

**Manual Control:**
- Disable auto-deploy in service settings
- Use "Deploy Latest Commit" button for manual deploys

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Project Issues**: https://github.com/Fresh-MC/Tracker/issues

---

## 🎉 Deployment Complete!

Your Tracker KPR application is now running securely on Render with:

✅ Hardened security (Helmet, rate limiting, input validation)  
✅ CORS configured for your frontend  
✅ Environment-based configuration  
✅ MongoDB persistence for chat messages  
✅ WebSocket authentication  
✅ Centralized error handling  
✅ Production-ready logging  
✅ Role-based access control  

**Next Steps:**
1. Set up custom domain
2. Configure error monitoring (Sentry)
3. Set up email notifications
4. Implement refresh tokens
5. Add comprehensive tests
