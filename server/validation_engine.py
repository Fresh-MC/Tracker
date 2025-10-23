"""
Validation Engine - Flask + SocketIO Backend
Automatically validates and completes user tasks based on GitHub push events.

This engine:
1. Receives GitHub webhook payloads on push events
2. Validates the pusher against assigned modules
3. Auto-completes tasks when validation rules match
4. Notifies manager dashboard in real-time via Socket.IO

Author: Fresh-MC
Created: October 24, 2025
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables from .env or .env.validation
load_dotenv('.env.validation')  # Try .env.validation first
if not os.getenv('MONGODB_URI'):
    load_dotenv('.env')  # Fallback to .env

# ==================== APP SETUP ====================

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize SocketIO with CORS allowed for all origins (testing mode)
# Using threading mode for Python 3.13+ compatibility (eventlet has SSL issues)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ==================== MONGODB CONNECTION ====================

MONGODB_URI = os.getenv('MONGODB_URI')

if not MONGODB_URI:
    print('❌ MONGODB_URI not found in environment variables')
    print('   Please check .env or .env.validation file')
    exit(1)

print(f'\n🔗 Connecting to MongoDB...')

try:
    # Add serverSelectionTimeoutMS to avoid long waits
    # For development: disable SSL certificate verification if needed
    import ssl
    
    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=5000,  # 5 second timeout
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
        tls=True,
        tlsAllowInvalidCertificates=True  # For development only
    )
    db = client['trackerdemo']  # Database name
    users_collection = db['users']
    projects_collection = db['projects']
    
    # Test connection with timeout
    client.admin.command('ping')
    print('✅ MongoDB Connected successfully')
    print(f'📊 Database: trackerdemo')
except Exception as e:
    print(f'❌ MongoDB Connection Error: {e}')
    print('   Make sure MongoDB Atlas is accessible and credentials are correct')
    exit(1)

# ==================== DATABASE HELPER FUNCTIONS ====================

"""
Helper functions to interact with MongoDB collections.

Collections:
- users: Contains user information with GitHub usernames
- projects: Contains projects with embedded modules array

Note: Modules are embedded within Project documents as subdocuments.
Each module has: id, title, description, assignedToUserId, status, etc.
"""

def get_user_by_github_username(github_username):
    """Find user by GitHub username."""
    return users_collection.find_one({'githubUsername': github_username})

def find_module_in_projects(user_id, repo_name, status='in-progress'):
    """
    Find a module assigned to the user with matching repo and status.
    
    Args:
        user_id: ObjectId of the user
        repo_name: GitHub repository name
        status: Module status (default: 'in-progress')
        
    Returns:
        tuple: (project_doc, module_index) if found, else (None, None)
    """
    # Find all projects
    projects = projects_collection.find({})
    
    for project in projects:
        if 'modules' in project and isinstance(project['modules'], list):
            for idx, module in enumerate(project['modules']):
                # Check if module matches criteria
                if (str(module.get('assignedToUserId')) == str(user_id) and 
                    module.get('status') == status):
                    
                    # Enhanced matching logic with validationRule
                    validation_rule = module.get('validationRule', {})
                    
                    # If module has validationRule with repo, match it
                    if validation_rule and validation_rule.get('githubRepo'):
                        if validation_rule['githubRepo'].lower() == repo_name.lower():
                            print(f"✅ Found module with validationRule match: {module.get('title')}")
                            return project, idx
                    else:
                        # Fallback: If no validationRule, match any in-progress module
                        # This allows Stage 6 to work with existing Stage 5B data
                        print(f"⚠️  Module '{module.get('title')}' has no validationRule, using as fallback")
                        return project, idx
    
    return None, None

def update_module_status(project_id, module_index, new_status='completed'):
    """
    Update module status in MongoDB.
    
    Args:
        project_id: ObjectId of the project
        module_index: Index of the module in the modules array
        new_status: New status value
        
    Returns:
        dict: Updated module data
    """
    result = projects_collection.update_one(
        {'_id': project_id},
        {
            '$set': {
                f'modules.{module_index}.status': new_status,
                f'modules.{module_index}.completedAt': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        # Fetch updated project to return module
        updated_project = projects_collection.find_one({'_id': project_id})
        return updated_project['modules'][module_index]
    
    return None

# ==================== CORE VALIDATION LOGIC ====================

def calculate_predictive_delay(module, user_id, projects_collection):
    """
    Calculate predicted delay for module completion (Stage 7 AI Layer)
    
    Args:
        module: Module document with due date info
        user_id: ObjectId of the user
        projects_collection: MongoDB projects collection
        
    Returns:
        dict: Delay prediction with confidence level
    """
    try:
        # Get module due date
        due_date = module.get('dueDate')
        if not due_date:
            return {
                'predictedDelay': 0,
                'delayReason': 'No due date set',
                'confidence': 'n/a',
                'avgCompletionTime': None,
                'historicalDataPoints': 0
            }
        
        # Get completion date
        completed_at = module.get('completedAt', datetime.utcnow())
        due_date_obj = due_date if isinstance(due_date, datetime) else datetime.fromisoformat(str(due_date).replace('Z', '+00:00'))
        
        # Calculate actual delay (negative = early, positive = late)
        delay_days = (completed_at - due_date_obj).days
        
        # Get user's historical completion times for ML prediction
        user_modules = list(projects_collection.aggregate([
            { '$unwind': '$modules' },
            { 
                '$match': {
                    'modules.assignedToUserId': user_id,
                    'modules.status': 'completed',
                    'modules.completedAt': { '$exists': True },
                    'modules.createdAt': { '$exists': True }
                }
            },
            { '$limit': 20 }  # Last 20 completed modules
        ]))
        
        completion_times = []
        for proj in user_modules:
            mod = proj.get('modules', {})
            created = mod.get('createdAt')
            completed = mod.get('completedAt')
            if created and completed:
                delta = (completed - created).days
                completion_times.append(delta)
        
        # Calculate average completion time
        avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 7
        
        # Determine confidence based on historical data
        confidence = 'high' if len(completion_times) >= 5 else 'medium' if len(completion_times) >= 2 else 'low'
        
        # Determine delay reason
        if delay_days > 0:
            reason = f"Completed {delay_days} days late"
        elif delay_days == 0:
            reason = "Completed on time"
        else:
            reason = f"Completed {abs(delay_days)} days early"
        
        return {
            'predictedDelay': delay_days,
            'delayReason': reason,
            'confidence': confidence,
            'avgCompletionTime': round(avg_completion_time, 1),
            'historicalDataPoints': len(completion_times)
        }
        
    except Exception as e:
        print(f"⚠️  Error calculating delay: {e}")
        return {
            'predictedDelay': 0,
            'delayReason': 'Calculation error',
            'confidence': 'low',
            'avgCompletionTime': None,
            'historicalDataPoints': 0
        }

def validate_github_push(payload):
    """
    Core validation logic for GitHub push events - MongoDB version.
    
    Args:
        payload (dict): GitHub webhook payload
        
    Returns:
        dict: Updated module object if validation succeeds, None otherwise
        
    Process:
    1. Extract pusher username from payload
    2. Extract repository name from payload
    3. Find matching user in MongoDB by githubUsername
    4. Find matching module (assigned to user, in-progress status, matching repo)
    5. Update module status to 'completed' in MongoDB
    6. Calculate predictive delay (Stage 7)
    7. Return updated module with project info and delay prediction
    """
    
    try:
        # Extract pusher information
        pusher_username = payload.get('pusher', {}).get('name')
        if not pusher_username:
            print("⚠️  No pusher username found in payload")
            return None
        
        # Extract repository information
        repo_name = payload.get('repository', {}).get('name')
        if not repo_name:
            print("⚠️  No repository name found in payload")
            return None
        
        # Optional: Extract branch information
        ref = payload.get('ref', '')
        branch = ref.split('/')[-1] if ref else None
        
        print(f"\n🔍 Validating Push Event:")
        print(f"   Pusher: {pusher_username}")
        print(f"   Repository: {repo_name}")
        print(f"   Branch: {branch}")
        
        # Find user by GitHub username in MongoDB
        user = get_user_by_github_username(pusher_username)
        
        if not user:
            print(f"⚠️  No user found with GitHub username: {pusher_username}")
            return None
        
        user_id = user['_id']
        user_name = user.get('name', user.get('username', 'Unknown'))
        user_role = user.get('role', 'user')
        print(f"✅ User found: {user_name} (ID: {user_id}, Role: {user_role})")
        
        # Find matching module in projects
        project, module_index = find_module_in_projects(user_id, repo_name, status='in-progress')
        
        if not project or module_index is None:
            print(f"⚠️  No matching in-progress module found for user {user_name} on repo {repo_name}")
            return None
        
        module = project['modules'][module_index]
        
        print(f"\n🎉 WORK VERIFIED!")
        print(f"   Module: {module.get('title', 'Untitled')}")
        print(f"   Completed by: {user_name} ({pusher_username})")
        print(f"   Repository: {repo_name}")
        if branch:
            print(f"   Branch: {branch}")
        
        # Update module status in MongoDB
        updated_module = update_module_status(project['_id'], module_index, 'completed')
        
        if updated_module:
            # Fetch fresh project data to get team information
            fresh_project = projects_collection.find_one({'_id': project['_id']})
            
            # Calculate predictive delay (Stage 7 AI Layer)
            delay_info = calculate_predictive_delay(updated_module, user_id, projects_collection)
            print(f"🤖 Predictive AI: {delay_info['delayReason']} (Confidence: {delay_info['confidence']})")
            
            # Add additional metadata for response
            result = {
                '_id': str(module.get('_id', '')),
                'id': module.get('id'),
                'title': module.get('title'),
                'description': module.get('description'),
                'status': 'completed',
                'assignedToUserId': str(module.get('assignedToUserId')),
                'assignedToName': user_name,
                'userRole': user_role,
                'projectId': str(project['_id']),
                'projectName': project.get('name'),
                'teamId': str(fresh_project.get('teamId')) if fresh_project.get('teamId') else None,
                'completedAt': datetime.utcnow().isoformat(),
                'completedBy': str(user_id),
                'completedByUsername': pusher_username,
                'repository': repo_name,
                'branch': branch,
                'commits': len(payload.get('commits', [])),
                'validationRule': module.get('validationRule')
            }
            
            # Merge delay information
            result.update(delay_info)
            
            return result
        
        return None
        
    except Exception as e:
        print(f"❌ Error in validate_github_push: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# ==================== WEBHOOK ENDPOINTS ====================

@app.route('/webhook/github', methods=['POST'])
def github_webhook():
    """
    GitHub Webhook Endpoint - Enhanced with Logging and RBAC
    
    Receives POST requests from GitHub when push events occur.
    Validates the push against assigned modules and auto-completes tasks.
    Emits real-time updates to dashboards via Socket.IO with RBAC filtering.
    Logs all webhook events for debugging.
    
    Returns:
        JSON response with status
    """
    
    print("\n" + "="*60)
    print("📨 GitHub Webhook Received")
    print(f"⏰ Timestamp: {datetime.utcnow().isoformat()}")
    print("="*60)
    
    # Get webhook payload
    payload = request.json
    
    if not payload:
        print("❌ No payload received")
        return jsonify({'status': 'error', 'message': 'No payload'}), 400
    
    # Log webhook details for debugging
    try:
        pusher_name = payload.get('pusher', {}).get('name', 'Unknown')
        repo_name = payload.get('repository', {}).get('name', 'Unknown')
        commits_count = len(payload.get('commits', []))
        ref = payload.get('ref', 'Unknown')
        
        print(f"📋 Webhook Details:")
        print(f"   Pusher: {pusher_name}")
        print(f"   Repository: {repo_name}")
        print(f"   Ref: {ref}")
        print(f"   Commits: {commits_count}")
    except Exception as log_error:
        print(f"⚠️  Error logging webhook details: {log_error}")
    
    # Validate the push event
    updated_module = validate_github_push(payload)
    
    if updated_module:
        # Success! Task auto-completed
        print(f"\n✅ WORK VERIFIED: Module '{updated_module['title']}' completed by {payload['pusher']['name']}")
        
        # Prepare Socket.IO event payload with RBAC metadata
        task_updated_event = {
            'type': 'module_completed',
            'module': updated_module,
            'timestamp': datetime.utcnow().isoformat(),
            'message': f"Task '{updated_module['title']}' auto-completed via GitHub push",
            'rbac': {
                'teamId': updated_module.get('teamId'),
                'assignedToUserId': updated_module.get('assignedToUserId'),
                'projectId': updated_module.get('projectId')
            },
            'delay': {
                'predictedDelay': updated_module.get('predictedDelay', 0),
                'delayReason': updated_module.get('delayReason', 'No prediction'),
                'confidence': updated_module.get('confidence', 'n/a'),
                'avgCompletionTime': updated_module.get('avgCompletionTime'),
                'historicalDataPoints': updated_module.get('historicalDataPoints', 0)
            }
        }
        
        # Emit Socket.IO event to notify all connected dashboards
        # Frontend will filter based on user role and team membership
        socketio.emit('task_updated', task_updated_event)
        
        # Emit analytics event for real-time chart updates (Stage 7)
        analytics_event = {
            'projectId': updated_module.get('projectId'),
            'teamId': updated_module.get('teamId'),
            'userId': updated_module.get('assignedToUserId') or updated_module.get('completedBy'),
            'action': 'module_completed',
            'moduleId': updated_module.get('_id'),
            'status': updated_module.get('status'),
            'timestamp': datetime.utcnow().isoformat(),
            'predictedDelay': updated_module.get('predictedDelay', 0),
            'delayReason': updated_module.get('delayReason', 'No prediction')
        }
        
        socketio.emit('module_updated', analytics_event)
        
        print("📡 Real-time 'task_updated' event sent to all connected clients")
        print("📊 Analytics 'module_updated' event emitted for chart updates")
        print(f"� RBAC data included: TeamId={updated_module.get('teamId')}, UserId={updated_module.get('assignedToUserId')}")
        
        # Log successful webhook processing
        print(f"\n✅ Webhook processed successfully")
        print(f"   Module ID: {updated_module.get('_id')}")
        print(f"   Project: {updated_module.get('projectName')}")
        print(f"   Delay: {updated_module.get('delayReason', 'No data')}")
        print("="*60 + "\n")
        
        return jsonify({
            'status': 'success',
            'message': 'Task validated and completed',
            'module': updated_module,
            'events_emitted': ['task_updated', 'module_updated']
        }), 200
    else:
        # No matching module found or validation failed
        print("\n⚠️  No task auto-completed (no matching criteria)")
        print("   Possible reasons:")
        print("   - User not found with GitHub username")
        print("   - No in-progress modules assigned to user")
        print("   - Repository name doesn't match validationRule")
        print("   - validationRule not enabled")
        print("="*60 + "\n")
        
        return jsonify({
            'status': 'success',
            'message': 'Webhook received but no task matched validation criteria',
            'payload_summary': {
                'pusher': payload.get('pusher', {}).get('name'),
                'repository': payload.get('repository', {}).get('name'),
                'commits': len(payload.get('commits', []))
            }
        }), 200

@app.route('/webhook/test', methods=['POST'])
def test_webhook():
    """
    Test endpoint to simulate GitHub webhook
    Useful for testing without actual GitHub pushes
    Includes full logging and event emission
    """
    
    print("\n" + "="*60)
    print("🧪 Test Webhook Called")
    print(f"⏰ Timestamp: {datetime.utcnow().isoformat()}")
    print("="*60)
    
    test_payload = request.json or {
        'pusher': {'name': 'Fresh-MC', 'email': 'test@example.com'},
        'repository': {'name': 'Tracker', 'full_name': 'Fresh-MC/Tracker'},
        'ref': 'refs/heads/main',
        'commits': [
            {
                'id': 'test123',
                'message': 'test: webhook integration',
                'timestamp': datetime.utcnow().isoformat()
            }
        ]
    }
    
    print(f"📋 Test Payload:")
    print(f"   Pusher: {test_payload.get('pusher', {}).get('name')}")
    print(f"   Repository: {test_payload.get('repository', {}).get('name')}")
    print(f"   Ref: {test_payload.get('ref')}")
    
    updated_module = validate_github_push(test_payload)
    
    if updated_module:
        # Prepare Socket.IO event payload
        task_updated_event = {
            'type': 'module_completed',
            'module': updated_module,
            'timestamp': datetime.utcnow().isoformat(),
            'message': f"[TEST] Task '{updated_module['title']}' completed",
            'rbac': {
                'teamId': updated_module.get('teamId'),
                'assignedToUserId': updated_module.get('assignedToUserId'),
                'projectId': updated_module.get('projectId')
            },
            'delay': {
                'predictedDelay': updated_module.get('predictedDelay', 0),
                'delayReason': updated_module.get('delayReason', 'No prediction'),
                'confidence': updated_module.get('confidence', 'n/a'),
                'avgCompletionTime': updated_module.get('avgCompletionTime'),
                'historicalDataPoints': updated_module.get('historicalDataPoints', 0)
            },
            'test': True
        }
        
        socketio.emit('task_updated', task_updated_event)
        
        # Emit analytics event for real-time chart updates (Stage 7)
        analytics_event = {
            'projectId': updated_module.get('projectId'),
            'teamId': updated_module.get('teamId'),
            'userId': updated_module.get('assignedToUserId') or updated_module.get('completedBy'),
            'action': 'module_completed',
            'moduleId': updated_module.get('_id'),
            'status': updated_module.get('status'),
            'timestamp': datetime.utcnow().isoformat(),
            'predictedDelay': updated_module.get('predictedDelay', 0),
            'test': True
        }
        
        socketio.emit('module_updated', analytics_event)
        
        print("\n✅ Test webhook successful!")
        print("📡 Socket.IO events emitted:")
        print("   - task_updated (with RBAC data)")
        print("   - module_updated (for analytics)")
        print(f"🤖 Delay Prediction: {updated_module.get('delayReason', 'No data')}")
        print("="*60 + "\n")
        
        return jsonify({
            'status': 'success',
            'message': 'Test completed successfully',
            'module': updated_module,
            'events_emitted': ['task_updated', 'module_updated'],
            'test': True
        }), 200
    
    print("\n⚠️  Test failed: No matching module found")
    print("="*60 + "\n")
    
    return jsonify({
        'status': 'no_match',
        'message': 'No matching module found',
        'test_payload': test_payload
    }), 200

# ==================== API ENDPOINTS ====================

@app.route('/api/modules', methods=['GET'])
def get_modules():
    """Get all modules from all projects in MongoDB"""
    try:
        projects = list(projects_collection.find({}))
        all_modules = []
        
        for project in projects:
            if 'modules' in project and isinstance(project['modules'], list):
                for module in project['modules']:
                    module_data = {
                        'id': module.get('id'),
                        '_id': str(module.get('_id', '')),
                        'title': module.get('title'),
                        'description': module.get('description'),
                        'status': module.get('status'),
                        'assignedToUserId': str(module.get('assignedToUserId')) if module.get('assignedToUserId') else None,
                        'projectId': str(project['_id']),
                        'projectName': project.get('name'),
                        'createdAt': module.get('createdAt').isoformat() if module.get('createdAt') else None
                    }
                    all_modules.append(module_data)
        
        return jsonify({'modules': all_modules, 'count': len(all_modules)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users from MongoDB"""
    try:
        users = list(users_collection.find({}, {
            'password': 0,  # Exclude password
            'githubToken': 0  # Exclude sensitive token
        }))
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user['_id'] = str(user['_id'])
            if user.get('teamId'):
                user['teamId'] = str(user['teamId'])
            if user.get('projectId'):
                user['projectId'] = str(user['projectId'])
        
        return jsonify({'users': users, 'count': len(users)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with MongoDB connection status"""
    try:
        # Ping MongoDB to check connection
        client.admin.command('ping')
        db_status = 'connected'
    except:
        db_status = 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'service': 'Validation Engine',
        'version': '2.0.0',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# ==================== SOCKET.IO HANDLERS ====================

@socketio.on('connect')
def handle_connect():
    """
    Socket.IO connection handler
    Called when manager dashboard connects to real-time updates
    """
    print("\n🔌 Manager dashboard connected to socket.")
    print("   Real-time task updates enabled")

@socketio.on('disconnect')
def handle_disconnect():
    """Socket.IO disconnection handler"""
    print("\n🔌 Manager dashboard disconnected from socket.")

@socketio.on('request_modules')
def handle_request_modules():
    """
    Socket.IO event to request current module status from MongoDB
    Allows dashboard to sync state on connection
    """
    print("\n📊 Manager requested module status")
    
    try:
        projects = list(projects_collection.find({}))
        all_modules = []
        
        for project in projects:
            if 'modules' in project and isinstance(project['modules'], list):
                for module in project['modules']:
                    module_data = {
                        'id': module.get('id'),
                        '_id': str(module.get('_id', '')),
                        'title': module.get('title'),
                        'description': module.get('description'),
                        'status': module.get('status'),
                        'assignedToUserId': str(module.get('assignedToUserId')) if module.get('assignedToUserId') else None,
                        'projectId': str(project['_id']),
                        'projectName': project.get('name')
                    }
                    all_modules.append(module_data)
        
        socketio.emit('modules_snapshot', {
            'modules': all_modules,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        print(f"❌ Error fetching modules: {e}")
        socketio.emit('error', {'message': 'Failed to fetch modules'})

# ==================== MAIN ====================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Validation Engine Starting with MongoDB...")
    print("="*60)
    print(f"📡 Port: 5002")
    print(f"🌐 Webhook: http://localhost:5002/webhook/github")
    print(f"🧪 Test: http://localhost:5002/webhook/test")
    print(f"📊 API: http://localhost:5002/api/modules")
    print(f"🔌 Socket.IO: Enabled on port 5002")
    print("="*60)
    
    # Get database stats
    try:
        user_count = users_collection.count_documents({})
        project_count = projects_collection.count_documents({})
        
        # Count modules
        total_modules = 0
        in_progress_modules = 0
        projects = list(projects_collection.find({}))
        for project in projects:
            if 'modules' in project:
                total_modules += len(project['modules'])
                in_progress_modules += len([m for m in project['modules'] if m.get('status') == 'in-progress'])
        
        print(f"\n📋 MongoDB Database Status:")
        print(f"   Users: {user_count}")
        print(f"   Projects: {project_count}")
        print(f"   Total Modules: {total_modules}")
        print(f"   In Progress: {in_progress_modules}")
    except Exception as e:
        print(f"\n⚠️  Could not fetch database stats: {e}")
    
    print("="*60)
    print("\n✅ Ready to validate GitHub pushes!\n")
    
    # Run the server
    # Note: debug=False to avoid issues with Flask reloader and threading async_mode
    socketio.run(app, host='0.0.0.0', port=5002, debug=False, allow_unsafe_werkzeug=True)
