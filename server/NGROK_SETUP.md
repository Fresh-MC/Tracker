# Ngrok Setup Guide for Validation Engine

## 🎯 Quick Start

The fastest way to expose your validation engine to GitHub webhooks:

```bash
cd server
./start_with_ngrok.sh
```

That's it! The script will:
- ✅ Start Flask validation engine on port 5002
- ✅ Start ngrok tunnel
- ✅ Display your public webhook URL
- ✅ Save URL to `ngrok_url.txt`
- ✅ Monitor both services for health

---

## 📁 Available Scripts

### 1. `start_with_ngrok.sh` (All-in-One)

**Purpose:** Unified launcher that starts both Flask and ngrok together.

**Usage:**
```bash
./start_with_ngrok.sh
```

**Features:**
- Checks dependencies (Python, ngrok, packages)
- Clears port 5002 if in use
- Starts Flask validation engine
- Starts ngrok tunnel manager
- Health monitoring for both services
- Graceful shutdown with Ctrl+C
- Detailed logging to `logs/` directory

**Output Files:**
- `logs/validation_engine.log` - Flask output
- `logs/ngrok_manager.log` - ngrok output
- `ngrok_url.txt` - Public webhook URL
- `.validation_engine.pid` - Flask process ID
- `.ngrok_manager.pid` - ngrok process ID

---

### 2. `ngrok_manager.py` (Ngrok Only)

**Purpose:** Standalone ngrok tunnel manager with auto-restart.

**Usage:**
```bash
# If Flask is already running
python3 ngrok_manager.py
```

**Features:**
- Checks if Flask is running on port 5002 (warns if not)
- Starts ngrok tunnel
- Fetches public URL from ngrok API
- Saves URL to `ngrok_url.txt`
- Monitors tunnel health every 30 seconds
- Auto-restarts on disconnect (up to 5 attempts)
- Displays GitHub webhook configuration instructions

**Sample Output:**
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

💡 Tips:
   - URL saved to: ngrok_url.txt
   - Dashboard: http://localhost:4040
   - Press Ctrl+C to stop
======================================================================

👀 Monitoring tunnel health (checking every 30s)...
✅ Tunnel active [14:30:45]
```

---

## 🔧 Configuration

### Environment Variables

The scripts use these environment variables (optional):

```bash
# Flask port (default: 5002)
export FLASK_PORT=5002

# Ngrok region (default: auto)
export NGROK_REGION=us  # Options: us, eu, ap, au, sa, jp, in
```

### Ngrok Authtoken (Recommended)

Free ngrok accounts get better features:

1. **Sign up:** https://ngrok.com/signup
2. **Get authtoken:** https://dashboard.ngrok.com/get-started/your-authtoken
3. **Add to ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

**Benefits:**
- Longer session times
- Better URLs
- More simultaneous tunnels
- Traffic inspection

---

## 📊 Monitoring

### View Logs

```bash
# Flask logs
tail -f logs/validation_engine.log

# ngrok logs
tail -f logs/ngrok_manager.log

# Both together
tail -f logs/*.log
```

### Ngrok Web Dashboard

Visit http://localhost:4040 to see:
- Active tunnels
- Request/response inspection
- Traffic replay
- Connection status

### Check Tunnel Status

```bash
# Via ngrok API
curl http://localhost:4040/api/tunnels | jq

# View saved URL
cat ngrok_url.txt
```

---

## 🐛 Troubleshooting

### Issue 1: "ngrok not found"

**Solution:**
```bash
# Install ngrok
brew install ngrok/ngrok/ngrok

# Verify installation
ngrok version
```

### Issue 2: "Port 5002 already in use"

**Solution:**
```bash
# Kill existing process
lsof -ti:5002 | xargs kill -9

# Or the script will do this automatically
./start_with_ngrok.sh
```

### Issue 3: "Flask server not detected"

**Solution:**
```bash
# Start Flask manually first
cd server
python3 validation_engine.py

# Then in another terminal
python3 ngrok_manager.py
```

### Issue 4: Tunnel disconnects frequently

**Solutions:**

1. **Use ngrok authtoken (free):**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

2. **Use auto-restart script:**
   ```bash
   python3 ngrok_manager.py  # Built-in auto-restart
   ```

3. **Upgrade to ngrok paid plan** for stable domains

### Issue 5: GitHub webhook fails with 502 Bad Gateway

**Cause:** Flask crashed or stopped

**Solution:**
```bash
# Check Flask logs
tail -n 50 logs/validation_engine.log

# Restart everything
./start_with_ngrok.sh
```

---

## 🚀 Production Deployment

For production, don't use ngrok. Instead:

### Option 1: Deploy to Cloud Platform

**Render.com / Railway.app / Heroku:**
```yaml
# render.yaml
services:
  - type: web
    name: validation-engine
    env: python
    buildCommand: pip install -r requirements-validation.txt
    startCommand: python validation_engine.py
```

**Your webhook URL:**
```
https://your-app.onrender.com/webhook/github
```

### Option 2: VPS with Reverse Proxy

**Using nginx + Let's Encrypt:**
```nginx
server {
    listen 80;
    server_name webhooks.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Your webhook URL:**
```
https://webhooks.yourdomain.com/webhook/github
```

### Option 3: Use GitHub Actions (Alternative)

Instead of webhooks, use GitHub Actions to trigger validation:

```yaml
# .github/workflows/validation.yml
name: Task Validation
on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Notify Validation Engine
        run: |
          curl -X POST https://your-server.com/webhook/github \
            -H "Content-Type: application/json" \
            -d '{"pusher": {"name": "${{ github.actor }}"}, "repository": {"name": "${{ github.event.repository.name }}"}}'
```

---

## 📝 Advanced Usage

### Custom Port

Edit `ngrok_manager.py`:
```python
FLASK_PORT = 5003  # Change to your port
```

### Multiple Tunnels

Start multiple ngrok tunnels:
```bash
# Terminal 1: Validation engine on 5002
ngrok http 5002

# Terminal 2: Main backend on 3000
ngrok http 3000
```

### Custom Subdomain (Paid Feature)

```bash
ngrok http 5002 --subdomain=my-company-validator
# URL: https://my-company-validator.ngrok.io
```

### Regional Endpoint

```bash
# Use Europe region for lower latency
ngrok http 5002 --region=eu
```

---

## 🔒 Security Best Practices

### 1. Add Webhook Secret

In production, verify webhook signatures:

```python
# validation_engine.py
import hmac
import hashlib

WEBHOOK_SECRET = os.getenv('GITHUB_WEBHOOK_SECRET')

@app.route('/webhook/github', methods=['POST'])
def github_webhook():
    # Verify signature
    signature = request.headers.get('X-Hub-Signature-256')
    if signature:
        expected = 'sha256=' + hmac.new(
            WEBHOOK_SECRET.encode(),
            request.data,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected):
            return jsonify({'error': 'Invalid signature'}), 403
    
    # Process webhook...
```

### 2. IP Whitelisting

Restrict access to GitHub's webhook IPs:

```python
GITHUB_WEBHOOK_IPS = [
    '192.30.252.0/22',
    '185.199.108.0/22',
    '140.82.112.0/20',
    '143.55.64.0/20'
]

@app.before_request
def check_ip():
    if request.path.startswith('/webhook'):
        client_ip = request.remote_addr
        # Verify IP is in allowed ranges
```

### 3. Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/webhook/github', methods=['POST'])
@limiter.limit("10 per minute")
def github_webhook():
    # Process webhook...
```

---

## 📚 Additional Resources

- **Ngrok Documentation:** https://ngrok.com/docs
- **GitHub Webhooks Guide:** https://docs.github.com/en/developers/webhooks-and-events/webhooks
- **Flask-SocketIO Docs:** https://flask-socketio.readthedocs.io/
- **Validation Engine README:** `VALIDATION_ENGINE_README.md`
- **Stage 6 Guide:** `STAGE6_REALTIME_VALIDATION.md`

---

## 💡 Quick Commands Reference

```bash
# Start everything
./start_with_ngrok.sh

# Stop everything
Ctrl+C (from running script)

# Just ngrok
python3 ngrok_manager.py

# View Flask logs
tail -f logs/validation_engine.log

# View ngrok dashboard
open http://localhost:4040

# Get current URL
cat ngrok_url.txt

# Test webhook
curl -X POST "$(head -n 1 ngrok_url.txt)/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{"githubUsername": "testuser", "repository": {"name": "test-repo"}}'

# Check health
curl http://localhost:5002/api/health

# Install ngrok
brew install ngrok/ngrok/ngrok

# Add authtoken
ngrok config add-authtoken YOUR_TOKEN
```

---

**Created:** October 24, 2025  
**Author:** Fresh-MC  
**Version:** 1.0.0
