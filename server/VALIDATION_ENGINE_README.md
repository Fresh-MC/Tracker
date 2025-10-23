# 🚀 Validation Engine

**Automatic Task Completion via GitHub Push Events**

A Flask + SocketIO backend that automatically validates and completes user tasks when they push code to their assigned GitHub repositories. Perfect for tracking team progress without manual updates!

## ✨ Features

- 🎯 **Automatic Validation** - Tasks auto-complete on GitHub pushes
- ⚡ **Real-time Updates** - Socket.IO notifications to manager dashboard
- 🔐 **RBAC Integration** - Works with existing user/role system
- 🧪 **Test Mode** - Built-in testing without GitHub webhooks
- 🔧 **Modular Design** - Easy MongoDB integration
- 📊 **Rich Logging** - Detailed console output for debugging

## 🏗️ Architecture

```
GitHub Push → Webhook → Validation Engine → MongoDB → Socket.IO → Manager Dashboard
     ↓                        ↓                  ↓            ↓
  Commits            Match User/Module    Update Status   Live Update
```

## 📦 Installation

### Prerequisites

- Python 3.8+
- pip3

### Quick Install

```bash
cd server
pip install -r requirements-validation.txt
```

Or use the quick start script:

```bash
cd server
./start_validation_engine.sh
```

## 🚀 Usage

### Start the Server

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
```

### Test Without GitHub

```bash
python test_validation_engine.py
```

Or manually:

```bash
curl -X POST http://localhost:5002/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "pusher": {"name": "Fresh-MC"},
    "repository": {"name": "Tracker"},
    "ref": "refs/heads/main"
  }'
```

## 🔧 Configuration

### Set Up GitHub Webhook

1. **Using ngrok (for local testing)**:
   ```bash
   ngrok http 5002
   ```
   Then add the ngrok URL to GitHub webhook settings.

2. **GitHub Webhook Settings**:
   - Go to repository → Settings → Webhooks → Add webhook
   - Payload URL: `https://your-ngrok-url.ngrok.io/webhook/github`
   - Content type: `application/json`
   - Events: Select "Just the push event"
   - Active: ✅

### Add Users

Edit `validation_engine.py` → `mock_db['users']`:

```python
{
    'id': 'user_005',
    'name': 'Jane Doe',
    'email': 'jane@example.com',
    'githubUsername': 'janedoe'  # Must match GitHub username exactly!
}
```

### Add Modules

Edit `validation_engine.py` → `mock_db['modules']`:

```python
{
    'id': 'module_005',
    'projectId': 'project_001',
    'title': 'New Feature Implementation',
    'assignedTo': 'user_005',
    'status': 'In Progress',  # Must be 'In Progress' to auto-complete
    'priority': 'high',
    'validationRule': {
        'source': 'github',
        'repo': 'your-repo-name',  # Must match GitHub repo name
        'branch': 'main'           # Optional: specific branch
    }
}
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/github` | POST | GitHub webhook receiver (production) |
| `/webhook/test` | POST | Test endpoint (no GitHub required) |
| `/api/modules` | GET | Get all modules |
| `/api/users` | GET | Get all users |
| `/api/health` | GET | Health check |

## 🔌 Socket.IO Events

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `task_updated` | `{type, module, timestamp, message}` | Task auto-completed |
| `modules_snapshot` | `{modules, timestamp}` | All modules status |

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Dashboard connected |
| `disconnect` | - | Dashboard disconnected |
| `request_modules` | - | Request current status |

## 🧪 Testing

### Run Test Suite

```bash
python test_validation_engine.py
```

Expected output:
```
🧪 Validation Engine Test Suite
============================================================
Test 1: Health Check                    ✅ PASS
Test 2: Get Modules                     ✅ PASS
Test 3: Get Users                       ✅ PASS
Test 4: Webhook Validation              ✅ PASS
Test 5: Verify Update                   ✅ PASS

Results: 5/5 tests passed
🎉 All tests passed! Validation engine is working correctly.
```

### Manual Testing

1. **Test Module Status**:
   ```bash
   curl http://localhost:5002/api/modules | jq
   ```

2. **Simulate GitHub Push**:
   ```bash
   curl -X POST http://localhost:5002/webhook/test \
     -H "Content-Type: application/json" \
     -d '{"pusher":{"name":"Fresh-MC"},"repository":{"name":"Tracker"}}'
   ```

3. **Verify Completion**:
   ```bash
   curl http://localhost:5002/api/modules | jq '.modules[] | select(.status=="Completed")'
   ```

## 🔗 Frontend Integration

### React Component (Manager Dashboard)

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ManagerDashboard() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to validation engine
    const newSocket = io('http://localhost:5002');
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to validation engine');
    });
    
    newSocket.on('task_updated', (data) => {
      console.log('🎉 Task completed:', data);
      
      // Show notification
      toast.success(data.message);
      
      // Refresh modules list
      fetchModules();
    });
    
    setSocket(newSocket);
    
    return () => newSocket.disconnect();
  }, []);

  return (
    <div>
      {/* Your dashboard UI */}
    </div>
  );
}
```

## 🔄 Validation Flow

1. **GitHub Push** → User commits and pushes code
2. **Webhook Triggered** → GitHub sends payload to `/webhook/github`
3. **Extract Data** → Parse pusher username, repo name, branch
4. **Find User** → Match GitHub username in database
5. **Find Module** → Match these criteria:
   - ✅ Assigned to this user
   - ✅ Status is "In Progress"
   - ✅ Validation rule repo matches
   - ✅ Optional: Branch matches
6. **Update Status** → Set module status to "Completed"
7. **Notify Dashboard** → Emit Socket.IO event with update
8. **Return Success** → Respond to GitHub webhook

## 📊 Mock Database Structure

### Users Collection
```javascript
{
  id: string,              // Unique user ID
  name: string,            // Full name
  email: string,           // Email address
  githubUsername: string   // GitHub username (CRITICAL!)
}
```

### Modules Collection
```javascript
{
  id: string,              // Unique module ID
  projectId: string,       // Parent project ID
  title: string,           // Module title
  description: string,     // Module description
  assignedTo: string,      // User ID
  status: string,          // 'Not Started' | 'In Progress' | 'Completed' | 'Blocked'
  priority: string,        // 'low' | 'medium' | 'high' | 'critical'
  validationRule: {
    source: 'github',      // Validation source
    repo: string,          // GitHub repository name (CRITICAL!)
    branch: string         // Optional: specific branch
  },
  completedAt?: string,    // ISO timestamp
  completedBy?: string     // User ID
}
```

## 🔐 Security Considerations

### Production Deployment

1. **Verify GitHub Signatures**:
   ```python
   import hmac
   
   def verify_signature(payload, signature):
       secret = os.getenv('GITHUB_WEBHOOK_SECRET')
       computed = hmac.new(secret.encode(), payload, 'sha256')
       return hmac.compare_digest(computed.hexdigest(), signature)
   ```

2. **Use Environment Variables**:
   ```bash
   export GITHUB_WEBHOOK_SECRET='your-secret-here'
   export MONGO_URI='mongodb+srv://...'
   export CORS_ORIGINS='https://your-frontend.com'
   ```

3. **Enable HTTPS**:
   - Use reverse proxy (nginx)
   - Or deploy to cloud platform (Heroku, Railway, Render)

## 🚀 Production Deployment

### Using Gunicorn

```bash
gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:5002 validation_engine:app
```

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements-validation.txt .
RUN pip install -r requirements-validation.txt

COPY validation_engine.py .

EXPOSE 5002

CMD ["python", "validation_engine.py"]
```

### Environment Variables

```bash
PORT=5002
MONGO_URI=mongodb+srv://...
CORS_ORIGINS=https://your-frontend.com
GITHUB_WEBHOOK_SECRET=your-secret
DEBUG=False
```

## 📚 Additional Resources

- [Full Documentation](./VALIDATION_ENGINE_GUIDE.md)
- [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Flask Documentation](https://flask.palletsprojects.com/)

## 🐛 Troubleshooting

### Issue: Webhook not received

**Check:**
- ✅ ngrok is running
- ✅ GitHub webhook URL is correct
- ✅ Validation engine is running
- ✅ Check GitHub webhook delivery logs

### Issue: Module not auto-completing

**Check:**
- ✅ GitHub username matches exactly (case-sensitive)
- ✅ Repo name matches `validationRule.repo`
- ✅ Module status is "In Progress"
- ✅ Module is assigned to the correct user

### Issue: Socket.IO not connecting

**Check:**
- ✅ CORS is enabled
- ✅ Port 5002 is not blocked
- ✅ Frontend is using correct URL
- ✅ Check browser console for errors

## 🎯 Next Steps

- [ ] Replace mock_db with MongoDB
- [ ] Add webhook signature verification
- [ ] Add user authentication for API endpoints
- [ ] Add support for other validation sources (GitLab, Bitbucket)
- [ ] Add email notifications on task completion
- [ ] Add detailed logging and analytics
- [ ] Deploy to production

## 📄 License

MIT License - Feel free to use and modify!

---

**Created**: October 24, 2025  
**Author**: Fresh-MC  
**Version**: 1.0.0
