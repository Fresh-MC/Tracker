# 🔐 Ngrok Authentication Required

## The Issue

Ngrok now requires a **free account** and **authtoken** to use tunnels. This is a recent change by ngrok.

**Error you saw:**
```
ERROR: authentication failed: Usage of ngrok requires a verified account and authtoken.
ERR_NGROK_4018
```

---

## ✅ Quick Solution (2 Minutes)

### **Option 1: Interactive Setup (Easiest)**

Run the interactive setup script:

```bash
cd server
./setup_ngrok_auth.sh
```

This script will:
1. Guide you through creating a free ngrok account
2. Help you get your authtoken
3. Automatically configure ngrok
4. Verify everything works

---

### **Option 2: Manual Setup**

**Step 1: Create Free Account**
1. Visit: https://dashboard.ngrok.com/signup
2. Sign up with GitHub/Google (fastest) or email
3. Takes 30 seconds ⚡

**Step 2: Get Your Authtoken**
1. After signup, you'll see your authtoken automatically
2. Or visit: https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy the token (looks like: `2abcXYZ123_4defGHI5678jklMNO9012pqrSTU`)

**Step 3: Configure Ngrok**
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

**Step 4: Verify**
```bash
ngrok config check
```

**Step 5: Start Everything**
```bash
./start_with_ngrok.sh
```

---

## 🎁 What You Get (Free Forever)

- ✅ Unlimited HTTP/HTTPS tunnels
- ✅ 40+ simultaneous connections
- ✅ Traffic inspection dashboard
- ✅ Better connection stability
- ✅ Replay requests for debugging
- ✅ Custom subdomains (on paid plans)

---

## 🚀 After Authentication

Once authenticated, run:

```bash
./start_with_ngrok.sh
```

You'll see:
```
======================================================================
  ✅ ALL SERVICES RUNNING
======================================================================

📡 Public URL:     https://abc123.ngrok.io
🔗 Webhook URL:    https://abc123.ngrok.io/webhook/github

🌐 Web Interfaces:
   Flask API:       http://localhost:5002/api/health
   ngrok Dashboard: http://localhost:4040
```

---

## 📋 Configuration Location

Your authtoken is saved to:
```
~/.config/ngrok/ngrok.yml
```

You only need to do this **once** - ngrok remembers your authtoken!

---

## 🔍 Troubleshooting

### "Command not found: ngrok"
```bash
brew install ngrok/ngrok/ngrok
```

### "Invalid authtoken format"
- Make sure you copied the entire token (40+ characters)
- No spaces before/after the token
- Get a fresh token from: https://dashboard.ngrok.com/get-started/your-authtoken

### "Still getting authentication error"
```bash
# Remove old config
rm ~/.config/ngrok/ngrok.yml

# Add authtoken again
ngrok config add-authtoken YOUR_TOKEN

# Verify
ngrok config check
```

### "Want to check current authtoken"
```bash
cat ~/.config/ngrok/ngrok.yml
```

---

## 💡 Alternative: Use Ngrok Web Interface

If you prefer a GUI:

1. **Start Flask manually:**
   ```bash
   python3 validation_engine.py
   ```

2. **Visit ngrok dashboard:**
   - Go to: https://dashboard.ngrok.com
   - Click "Create Edge" → "Create HTTP Edge"
   - Follow the web UI instructions

3. **Start tunnel from dashboard:**
   - Click "Start Tunnel"
   - Point to `localhost:5002`

---

## 🎯 Quick Commands

```bash
# Interactive setup (recommended)
./setup_ngrok_auth.sh

# Manual authtoken setup
ngrok config add-authtoken YOUR_TOKEN

# Check if authenticated
ngrok config check

# View current config
cat ~/.config/ngrok/ngrok.yml

# Start validation engine + ngrok
./start_with_ngrok.sh

# Test ngrok manually
ngrok http 5002
```

---

## 🌐 Ngrok Dashboard

After authentication, visit:
**http://localhost:4040**

Features:
- 🔍 Inspect all HTTP requests/responses
- 🔄 Replay requests for testing
- 📊 See bandwidth usage
- 🕐 View request history
- 🐛 Debug webhook issues

---

## 📚 Additional Resources

- **Ngrok Signup:** https://dashboard.ngrok.com/signup
- **Get Authtoken:** https://dashboard.ngrok.com/get-started/your-authtoken
- **Ngrok Docs:** https://ngrok.com/docs
- **Error Reference:** https://ngrok.com/docs/errors/err_ngrok_4018

---

## ✅ Once Authenticated

Everything will work as designed:

1. ✅ Start services: `./start_with_ngrok.sh`
2. ✅ Get public URL automatically
3. ✅ Copy webhook URL for GitHub
4. ✅ Real-time validation works!
5. ✅ Auto-restart on disconnect
6. ✅ Health monitoring enabled

**This is a one-time setup!** 🎉

---

**Created:** October 24, 2025  
**Issue:** Ngrok authentication now required  
**Solution:** Free account + authtoken (takes 2 minutes)
