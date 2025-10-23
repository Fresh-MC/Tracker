# Validation Engine - Setup & Testing Guide

## 📋 Overview

The Validation Engine is a Flask + SocketIO backend that automatically validates and completes user tasks based on GitHub push events. When a user pushes code to their assigned repository, the system automatically marks their task as complete and notifies the manager dashboard in real-time.

## 🎯 Features

- ✅ **Automatic Task Validation** - Validates GitHub pushes against assigned modules
- ✅ **Real-time Notifications** - Socket.IO updates to manager dashboard
- ✅ **RBAC Integration** - Works with existing user/module system
- ✅ **Modular Design** - Easy to replace mock_db with MongoDB
- ✅ **Test Endpoints** - Built-in testing without GitHub webhooks

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd server
pip install -r requirements-validation.txt
```

### Step 2: Run the Validation Engine

```bash
python validation_engine.py
```

Expected output:
```
============================================================
🚀 Validation Engine Starting...
============================================================
📡 Port: 5002
🌐 Webhook: http://localhost:5002/webhook/github
🧪 Test: http://localhost:5002/webhook/test
📊 API: http://localhost:5002/api/modules
🔌 Socket.IO: Enabled on port 5002
============================================================

📋 Mock Database Status:
   Users: 4
   Modules: 4
   In Progress: 3
============================================================

✅ Ready to validate GitHub pushes!
```

### Step 3: Configure GitHub Webhook

**Option A: Using ngrok (for local testing)**

1. Install ngrok: `brew install ngrok` (macOS)
2. Start ngrok tunnel: `ngrok http 5002`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Go to GitHub repository settings → Webhooks → Add webhook
5. Set Payload URL: `https://abc123.ngrok.io/webhook/github`
6. Content type: `application/json`
7. Select event: Just the `push` event
8. Click "Add webhook"

**Option B: Using GitHub CLI (if available)**

```bash
gh webhook forward --repo=Fresh-MC/Tracker \
  --events=push \
  --url=http://localhost:5002/webhook/github
```

## 🧪 Testing

### Test 1: Manual Test (Without GitHub)

Test the validation logic without actual GitHub pushes:

```bash
curl -X POST http://localhost:5002/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "pusher": {"name": "Fresh-MC"},
    "repository": {"name": "Tracker"},
    "ref": "refs/heads/main"
  }'
```

Expected response:
```json
{
  "status": "success",
  "message": "Task validated and completed",
  "module": {
    "id": "module_001",
    "title": "User Authentication System",
    "status": "Completed",
    "completedAt": "2025-10-24T..."
  }
}
```

### Test 2: Check Module Status

```bash
curl http://localhost:5002/api/modules
```

You should see the module status changed to "Completed".

### Test 3: Real GitHub Push

1. Make a change to the Tracker repository
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test validation engine"
   git push origin main
   ```
3. Check the validation engine console - you should see:
   ```
   ============================================================
   📨 GitHub Webhook Received
   ============================================================

   🔍 Validating Push Event:
      Pusher: Fresh-MC
      Repository: Tracker
      Branch: main

   ✅ User found: Sachin Kumar (ID: user_001)

   🎉 WORK VERIFIED!
      Module: User Authentication System
      Completed by: Sachin Kumar (Fresh-MC)
      Repository: Tracker
      Branch: main

   ✅ WORK VERIFIED: Module 'User Authentication System' completed by Fresh-MC
   📡 Real-time update sent to manager dashboard
   ```

### Test 4: Socket.IO Connection (Frontend)

Create a simple HTML test file to verify Socket.IO updates:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Manager Dashboard Test</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
    <h1>Manager Dashboard - Real-time Updates</h1>
    <div id="updates"></div>

    <script>
        const socket = io('http://localhost:5002');
        
        socket.on('connect', () => {
            console.log('✅ Connected to validation engine');
            document.getElementById('updates').innerHTML += '<p>✅ Connected</p>';
        });
        
        socket.on('task_updated', (data) => {
            console.log('📨 Task updated:', data);
            document.getElementById('updates').innerHTML += 
                `<p>🎉 ${data.message}</p>`;
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected');
        });
    </script>
</body>
</html>
```

## 📊 Mock Database Structure

### Users
```javascript
{
  'id': 'user_001',
  'name': 'Sachin Kumar',
  'email': 'sachin@example.com',
  'githubUsername': 'Fresh-MC'  // Must match GitHub username
}
```

### Modules
```javascript
{
  'id': 'module_001',
  'projectId': 'project_001',
  'title': 'User Authentication System',
  'assignedTo': 'user_001',
  'status': 'In Progress',  // Will change to 'Completed'
  'validationRule': {
    'source': 'github',
    'repo': 'Tracker',       // Must match GitHub repo name
    'branch': 'main'         // Optional: specific branch
  }
}
```

## 🔄 Validation Flow

1. **GitHub Push** → Webhook triggered
2. **Extract Data** → Pusher username, repo name, branch
3. **Find User** → Match GitHub username in mock_db
4. **Find Module** → Match criteria:
   - Assigned to this user
   - Status is "In Progress"
   - Validation rule repo matches
   - Optional: branch matches
5. **Update Module** → Set status to "Completed"
6. **Notify Dashboard** → Emit Socket.IO event
7. **Return Success** → Respond to webhook

## 🔧 Configuration

### Adding New Users

Edit `validation_engine.py` → `mock_db['users']`:

```python
{
    'id': 'user_005',
    'name': 'New User',
    'email': 'newuser@example.com',
    'githubUsername': 'github_username_here'  # IMPORTANT!
}
```

### Adding New Modules

Edit `validation_engine.py` → `mock_db['modules']`:

```python
{
    'id': 'module_005',
    'projectId': 'project_001',
    'title': 'New Feature',
    'assignedTo': 'user_005',
    'status': 'In Progress',
    'priority': 'high',
    'validationRule': {
        'source': 'github',
        'repo': 'your-repo-name',  # GitHub repo name
        'branch': 'main'           # Optional
    }
}
```

### Port Configuration

To change the port from 5002:

```python
# At the bottom of validation_engine.py
socketio.run(app, port=YOUR_PORT, debug=True)
```

## 🔗 Integration with Main App

### Step 1: Connect Socket.IO in Frontend

In your React dashboard component:

```javascript
import { io } from 'socket.io-client';

useEffect(() => {
  const socket = io('http://localhost:5002');
  
  socket.on('connect', () => {
    console.log('✅ Connected to validation engine');
  });
  
  socket.on('task_updated', (data) => {
    console.log('🎉 Task completed:', data);
    // Refresh your modules list
    fetchModules();
    // Show notification
    toast.success(data.message);
  });
  
  return () => socket.disconnect();
}, []);
```

### Step 2: Replace Mock DB with MongoDB

When ready for production, replace the mock_db with MongoDB queries:

```python
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient(os.getenv('MONGO_URI'))
db = client['trackerdemo']

# Replace mock_db lookups with MongoDB queries
def validate_github_push(payload):
    pusher_username = payload['pusher']['name']
    repo_name = payload['repository']['name']
    
    # Find user in MongoDB
    user = db.users.find_one({'githubUsername': pusher_username})
    
    if user:
        # Find matching module
        module = db.modules.find_one_and_update(
            {
                'assignedTo': user['_id'],
                'status': 'In Progress',
                'validationRule.repo': repo_name
            },
            {
                '$set': {
                    'status': 'Completed',
                    'completedAt': datetime.utcnow()
                }
            },
            return_document=True
        )
        
        return module
    
    return None
```

## 🐛 Troubleshooting

### Issue: Webhook not received

**Solution:**
1. Check ngrok is running: `ngrok http 5002`
2. Verify GitHub webhook URL is correct
3. Check GitHub webhook delivery logs
4. Ensure validation engine is running

### Issue: Module not auto-completing

**Solution:**
1. Verify GitHub username matches exactly (case-sensitive)
2. Check repo name matches `validationRule.repo`
3. Ensure module status is "In Progress"
4. Check validation engine console for error messages

### Issue: Socket.IO not connecting

**Solution:**
1. Verify CORS is enabled: `cors_allowed_origins="*"`
2. Check port 5002 is not blocked by firewall
3. Ensure frontend is using correct Socket.IO URL
4. Check browser console for connection errors

### Issue: Multiple modules completed

**Solution:**
The validation logic finds the first matching module. To complete specific modules, add more specific validation rules:
- Use different repositories
- Use specific branches
- Add custom validation conditions

## 📈 Next Steps

### 1. Add More Validation Sources

```python
def validate_gitlab_push(payload):
    # Validate GitLab pushes
    pass

def validate_jira_ticket(payload):
    # Validate Jira ticket completion
    pass
```

### 2. Add Email Notifications

```python
from sendgrid import SendGridAPIClient

def notify_manager(module):
    # Send email to manager
    pass
```

### 3. Add Logging

```python
import logging

logging.basicConfig(
    filename='validation_engine.log',
    level=logging.INFO
)
```

### 4. Add Authentication

```python
from functools import wraps

def verify_github_signature(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Verify webhook signature
        pass
    return decorated

@app.route('/webhook/github', methods=['POST'])
@verify_github_signature
def github_webhook():
    pass
```

## 📚 API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/github` | POST | GitHub webhook receiver |
| `/webhook/test` | POST | Test endpoint (no GitHub required) |
| `/api/modules` | GET | Get all modules |
| `/api/users` | GET | Get all users |
| `/api/health` | GET | Health check |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client → Server | Dashboard connected |
| `disconnect` | Client → Server | Dashboard disconnected |
| `request_modules` | Client → Server | Request module snapshot |
| `task_updated` | Server → Client | Task auto-completed |
| `modules_snapshot` | Server → Client | All modules status |

## ✅ Testing Checklist

- [ ] Validation engine starts without errors
- [ ] Health check endpoint returns 200
- [ ] Test endpoint auto-completes module
- [ ] GitHub webhook is configured
- [ ] Real GitHub push auto-completes task
- [ ] Socket.IO connection established
- [ ] Real-time updates received in frontend
- [ ] Correct module matched and completed
- [ ] No duplicate completions
- [ ] Logs show detailed validation flow

---

**Status**: ✅ Ready for testing
**Version**: 1.0.0
**Last Updated**: October 24, 2025
