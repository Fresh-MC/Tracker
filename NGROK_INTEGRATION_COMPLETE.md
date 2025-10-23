# Ngrok Integration - Setup Complete ✅

## 🎉 What Was Done

Successfully integrated ngrok tunneling for GitHub webhook support with the Flask validation engine.

---

## 📁 Created Files

### 1. `ngrok_manager.py` (Python Script)
**Purpose**: Standalone ngrok tunnel manager with intelligent features

**Features**:
- ✅ Starts ngrok tunnel on port 5002
- ✅ Fetches and displays public URL from ngrok API
- ✅ Saves webhook URL to `ngrok_url.txt` file
- ✅ Health monitoring every 30 seconds
- ✅ Auto-restart on disconnect (up to 5 attempts)
- ✅ Checks if Flask server is running
- ✅ Displays GitHub webhook configuration instructions
- ✅ Graceful shutdown with Ctrl+C

**Usage**:
```bash
python3 ngrok_manager.py
```

---

### 2. `start_with_ngrok.sh` (Bash Script)
**Purpose**: All-in-one launcher for Flask + ngrok

**Features**:
- ✅ Dependency checking (Python, ngrok, packages)
- ✅ Port conflict resolution (clears port 5002)
- ✅ Starts Flask validation engine in background
- ✅ Starts ngrok manager in background
- ✅ Health checks for both services
- ✅ Logs everything to `logs/` directory
- ✅ Process ID tracking (`.pid` files)
- ✅ Monitoring loop with status updates
- ✅ Cleanup on Ctrl+C (kills both processes)
- ✅ Color-coded terminal output

**Usage**:
```bash
./start_with_ngrok.sh
```

---

### 3. `NGROK_SETUP.md` (Documentation)
**Purpose**: Complete ngrok setup and usage guide

**Sections**:
- Quick start instructions
- Available scripts reference
- Configuration options
- Monitoring commands
- Troubleshooting (7 common issues)
- Production deployment alternatives
- Security best practices
- Advanced usage (custom ports, subdomains)
- Quick commands reference

---

## 🚀 Quick Start Guide

### Option A: Automated Setup (Recommended)

```bash
cd server
./start_with_ngrok.sh
```

**What happens:**
1. Script checks all dependencies
2. Clears port 5002 if in use
3. Starts Flask validation engine (PID tracked)
4. Starts ngrok tunnel (PID tracked)
5. Displays public webhook URL
6. Saves URL to `ngrok_url.txt`
7. Monitors both services for health
8. Restarts automatically if either dies

**Output:**
```
======================================================================
  ✅ ALL SERVICES RUNNING
======================================================================

📊 Status:
   🔥 Flask validation engine: RUNNING (PID: 12345)
   🌐 ngrok tunnel manager:    RUNNING (PID: 12346)

🔗 Public URLs:
https://abc123.ngrok.io
Webhook URL: https://abc123.ngrok.io/webhook/github
Generated: 2025-10-24 14:30:00

📝 Logs:
   Flask:  tail -f logs/validation_engine.log
   ngrok:  tail -f logs/ngrok_manager.log

🌐 Web Interfaces:
   Flask API:       http://localhost:5002/api/health
   ngrok Dashboard: http://localhost:4040

💡 Tips:
   - Press Ctrl+C to stop all services
   - Monitor in real-time: tail -f logs/validation_engine.log
   - View ngrok traffic: open http://localhost:4040
```

---

### Option B: Just Ngrok (Flask Already Running)

```bash
python3 ngrok_manager.py
```

**Output:**
```
======================================================================
🎉 NGROK TUNNEL ACTIVE
======================================================================

📡 Public URL:     https://abc123.ngrok.io
🔗 Webhook URL:    https://abc123.ngrok.io/webhook/github
🏠 Local Server:   http://localhost:5002

📋 GitHub Webhook Configuration:
   1. Go to: GitHub Repo → Settings → Webhooks → Add webhook
   2. Payload URL: https://abc123.ngrok.io/webhook/github
   3. Content type: application/json
   4. Events: Just the push event
   5. Active: ✅ Check this box

👀 Monitoring tunnel health (checking every 30s)...
✅ Tunnel active [14:30:45]
```

---

## 🔧 Configuration

### GitHub Webhook Setup

1. **Get your webhook URL:**
   ```bash
   cat server/ngrok_url.txt
   ```

2. **Add to GitHub:**
   - Go to: Repository → Settings → Webhooks → Add webhook
   - Payload URL: `https://your-ngrok-id.ngrok.io/webhook/github`
   - Content type: `application/json`
   - Events: Just the push event
   - Active: ✅ (checked)

3. **Test webhook:**
   - Push code to GitHub
   - Check ngrok dashboard: http://localhost:4040
   - Verify in Flask logs: `tail -f logs/validation_engine.log`

---

## 📊 Monitoring

### View Logs

```bash
# Flask output
tail -f logs/validation_engine.log

# Ngrok output
tail -f logs/ngrok_manager.log

# Both together
tail -f logs/*.log
```

### Ngrok Web Dashboard

Visit http://localhost:4040 for:
- Active tunnels list
- Real-time request inspection
- Response body viewing
- Traffic replay
- Connection stats

### Check Status

```bash
# Current webhook URL
cat ngrok_url.txt

# Flask health check
curl http://localhost:5002/api/health

# Ngrok API
curl http://localhost:4040/api/tunnels | jq
```

---

## 🐛 Troubleshooting

### Issue 1: "ngrok not found"

```bash
# Install ngrok
brew install ngrok/ngrok/ngrok

# Verify
ngrok version
```

### Issue 2: Port 5002 in use

```bash
# Kill existing process
lsof -ti:5002 | xargs kill -9

# Or let script handle it
./start_with_ngrok.sh  # Auto-clears port
```

### Issue 3: Flask crashes

```bash
# Check logs
tail -n 50 logs/validation_engine.log

# Check MongoDB connection
# Check .env.validation file

# Restart everything
./start_with_ngrok.sh
```

### Issue 4: Tunnel disconnects

**Cause:** Free ngrok tunnels have 2-hour session limit

**Solutions:**

1. **Use auto-restart (built-in):**
   - Scripts automatically restart on disconnect

2. **Get ngrok authtoken (free):**
   ```bash
   # Sign up at https://ngrok.com
   ngrok config add-authtoken YOUR_TOKEN
   # Longer sessions + better URLs
   ```

3. **Use ngrok paid plan:**
   - Permanent subdomains
   - No session limits

### Issue 5: GitHub webhook timeout

**Check:**
1. Is Flask running? `curl http://localhost:5002/api/health`
2. Is ngrok running? `curl http://localhost:4040/api/tunnels`
3. Firewall blocking? Check macOS Security & Privacy

**Test locally:**
```bash
curl -X POST "$(head -n 1 server/ngrok_url.txt)/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{"githubUsername": "testuser", "repository": {"name": "test-repo"}}'
```

---

## 📁 Generated Files

| File | Purpose | Auto-generated |
|------|---------|----------------|
| `ngrok_url.txt` | Public webhook URL | ✅ Yes |
| `logs/validation_engine.log` | Flask output | ✅ Yes |
| `logs/ngrok_manager.log` | Ngrok output | ✅ Yes |
| `.validation_engine.pid` | Flask process ID | ✅ Yes |
| `.ngrok_manager.pid` | Ngrok process ID | ✅ Yes |

**Clean up:**
```bash
# Stop services (Ctrl+C automatically cleans up)
# Or manually:
rm -rf logs/ ngrok_url.txt .*.pid
```

---

## 🎯 Integration with Stage 6

The ngrok setup integrates seamlessly with Stage 6 validation flow:

```
GitHub Push
    ↓
Webhook to ngrok URL (https://abc123.ngrok.io/webhook/github)
    ↓
Tunnels to localhost:5002
    ↓
Flask validation_engine.py receives webhook
    ↓
Validates pusher + repo against MongoDB
    ↓
Updates module status to 'completed'
    ↓
Emits Socket.IO 'task_updated' event
    ↓
All connected dashboards receive update in real-time
    ↓
UI shows notification + refreshes data
```

---

## 🚀 Production Alternatives

For production deployment, replace ngrok with:

### Option 1: Cloud Platform
- **Render.com** (free tier available)
- **Railway.app** (free trial)
- **Heroku** (paid)

### Option 2: VPS + Domain
- nginx reverse proxy
- Let's Encrypt SSL
- Your own domain

### Option 3: GitHub Actions
- Alternative to webhooks
- Trigger validation from CI/CD

See `NGROK_SETUP.md` for detailed production deployment guides.

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `NGROK_SETUP.md` | Complete ngrok guide |
| `STAGE6_REALTIME_VALIDATION.md` | Stage 6 implementation guide |
| `VALIDATION_ENGINE_README.md` | Flask validation engine docs |
| `server/README.md` | Updated with ngrok section |

---

## ✅ Testing Checklist

- [x] ngrok installed and verified
- [x] `ngrok_manager.py` created with auto-restart
- [x] `start_with_ngrok.sh` created with full monitoring
- [x] Both scripts made executable
- [x] Documentation updated (4 files)
- [x] Troubleshooting guide added
- [x] Production alternatives documented
- [ ] **Next**: Configure GitHub webhook with ngrok URL
- [ ] **Next**: Test real GitHub push event
- [ ] **Next**: Verify real-time dashboard updates

---

## 🎓 Key Learnings

1. **Ngrok** exposes localhost to internet safely
2. **Auto-restart** prevents webhook downtime
3. **Health monitoring** ensures services stay alive
4. **Logging** helps debug webhook issues
5. **ngrok authtoken** provides better stability (free)
6. **Production** needs proper domain + SSL (no ngrok)

---

## 💡 Pro Tips

1. **Get ngrok authtoken** (free) for longer sessions
2. **Open ngrok dashboard** (localhost:4040) to inspect traffic
3. **Save ngrok URL** to environment variable for easy access
4. **Use unified script** for development
5. **Switch to proper hosting** for production

---

## 📞 Support

- **Ngrok Issues**: https://ngrok.com/docs
- **Validation Engine**: Check `VALIDATION_ENGINE_README.md`
- **Stage 6 Guide**: Check `STAGE6_REALTIME_VALIDATION.md`
- **GitHub Webhooks**: https://docs.github.com/webhooks

---

**Setup Date**: October 24, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready (Development)
