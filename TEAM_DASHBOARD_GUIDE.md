# Team Dashboard - Dynamic Backend Integration Guide

## 🎯 Overview

The Team Dashboard has been fully refactored with:
- ✅ **Dynamic Backend Integration** - All data fetched from MongoDB
- ✅ **RBAC (Role-Based Access Control)** - Managers vs Team Members permissions
- ✅ **Multi-Team Support** - Team filtering and management
- ✅ **Real-Time Statistics** - Task completion tracking per user and team
- ✅ **Team Assignment** - Managers can assign users to teams
- ✅ **Project Management** - Projects linked to teams with modules

---

## 📋 Architecture

### **Frontend Components**
```
TeamDashboard.jsx (pages/)
├── Dynamic data fetching from API
├── RBAC-aware UI rendering
├── Team filtering and search
├── Performance leaderboard
├── User cards with CircularProgress
└── Hover detail cards (UserDetailsCard)
```

### **Backend Structure**
```
Models:
├── User.js - User schema with teamId, projectId, role
├── Team.js - Team schema with members[], projectId
├── Project.js - Project schema with modules[], teamId
└── Task.js - Task schema with assignedTo, status

Controllers:
├── teamController.js - Team CRUD, assignment logic
├── projectController.js - Project CRUD, module updates
└── userController.js - User CRUD with RBAC filtering

Routes:
├── /api/teams - Team management endpoints
├── /api/projects - Project management endpoints
├── /api/users - User endpoints (RBAC filtered)
└── /api/tasks - Task endpoints
```

---

## 🔐 RBAC Rules

### **Manager/Admin**
**Can:**
- ✅ View all teams and projects
- ✅ Assign users to teams
- ✅ Create/edit/delete teams and projects
- ✅ Update any task/module status
- ✅ See all users in the system

**UI Features:**
- "Manage Assignments" button on user cards
- Team assignment modal
- Refresh button
- Full team filter dropdown

### **Team Lead/Employee**
**Can:**
- ✅ View only their own team
- ✅ See team members and assigned project
- ✅ Update tasks assigned to them
- ✅ View team statistics

**UI Features:**
- No "Manage Assignments" button
- Limited team filter (own team only)
- Read-only for other members' tasks

---

## 🛠️ API Endpoints

### **Teams**
```javascript
GET /api/teams
// Fetch all teams (filtered by role)
// Manager: All teams
// Employee: Only their team

GET /api/teams/:id
// Fetch specific team details

POST /api/teams
// Create new team (managers only)
// Body: { name, description, members: [userIds], projectId }

PUT /api/teams/:id
// Update team (managers only)
// Body: { name, description, projectId }

POST /api/teams/:id/assign
// Assign user to team (managers only)
// Body: { userId }

DELETE /api/teams/:id/remove/:userId
// Remove user from team (managers only)
```

### **Projects**
```javascript
GET /api/projects
// Fetch all projects (filtered by role)

GET /api/projects/:id
// Fetch specific project with modules

POST /api/projects
// Create new project (managers only)
// Body: { name, description, modules: [{id, title}], teamId }

PUT /api/projects/:id
// Update project (managers only)

PUT /api/projects/:id/modules/:moduleId
// Update module status
// Body: { status: 'not-started' | 'in-progress' | 'completed' | 'blocked' }
```

### **Users**
```javascript
GET /api/users
// Fetch all users (RBAC filtered)
// Manager: All users
// Employee: Only team members

GET /api/users/:id
// Fetch specific user details
```

### **Tasks**
```javascript
GET /api/tasks
// Fetch all tasks (filtered by access)

PUT /api/tasks/:id
// Update task status
// Body: { status: 'completed' }
```

---

## 📊 Data Models

### **User Schema**
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  role: 'user' | 'team_lead' | 'manager' | 'admin',
  teamId: ObjectId (ref: Team),
  projectId: ObjectId (ref: Project),
  githubUsername: String,
  githubStats: { repos, commits, pullRequests, issues, stars },
  isActive: Boolean
}
```

### **Team Schema**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  members: [ObjectId] (ref: User),
  projectId: ObjectId (ref: Project),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### **Project Schema**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  modules: [{
    id: Number,
    title: String,
    description: String,
    assignedToUserId: ObjectId (ref: User),
    status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  }],
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived',
  teamId: ObjectId (ref: Team),
  createdBy: ObjectId (ref: User),
  startDate: Date,
  endDate: Date
}
```

### **Task Schema**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  assignedTo: ObjectId (ref: User),
  status: 'pending' | 'in-progress' | 'completed',
  priority: 'low' | 'medium' | 'high',
  dueDate: Date
}
```

---

## 🚀 Setup & Testing

### **1. Start Backend Server**
```bash
cd server
npm install
node src/server.js
```

### **2. Create Test Data**
Use the following script or manually via API:

```bash
# Create a team
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha",
    "description": "Frontend Development Team",
    "members": []
  }'

# Assign user to team
curl -X POST http://localhost:3000/api/teams/TEAM_ID/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID"
  }'

# Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "KPR Tracker Dashboard",
    "description": "Main project",
    "teamId": "TEAM_ID",
    "modules": [
      { "id": 1, "title": "Build API" },
      { "id": 2, "title": "Design UI" }
    ]
  }'
```

### **3. Test Frontend**
```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5174/team-dashboard`

### **4. Test Scenarios**

**As Manager:**
1. Login with manager account
2. See all teams in dropdown
3. Click "Manage Assignments" on any user
4. Assign user to different teams
5. See all users across all teams

**As Employee:**
1. Login with regular user account
2. See only "All Teams" and your team in dropdown
3. No "Manage Assignments" button visible
4. Only see members of your team

**Team Statistics:**
1. Verify total members count
2. Check completed tasks count
3. Verify completion rate percentage
4. Leaderboard shows top 5 performers

**Search & Filter:**
1. Search by username → filters users
2. Search by role → shows matching roles
3. Select team → shows only team members
4. Combine search + team filter

---

## 🎨 UI Features

### **Statistics Cards**
```
┌─────────────────────────────────────┐
│ 👥 Total Members        12          │
│ 📁 Total Tasks          45          │
│ ✅ Completed            38          │
│ 🏆 Completion Rate      84%         │
└─────────────────────────────────────┘
```

### **Leaderboard**
```
┌────────────────────────────────────────┐
│ 🏆 Top Performers                      │
│                                        │
│ 🥇 1. Alice (Developer)    95% ✅      │
│ 🥈 2. Bob (Manager)        90% ✅      │
│ 🥉 3. Carol (Team Lead)    87% ✅      │
└────────────────────────────────────────┘
```

### **User Cards**
```
┌──────────────────────┐
│       [A]            │  ← Avatar circle
│   👨‍💻 Alice          │  ← Name + Role icon
│  [Developer Badge]   │  ← Role badge
│                      │
│   ◯ 85% ◯           │  ← Circular progress
│                      │
│  12/15 tasks done    │  ← Task stats
│  alice@example.com   │  ← Email
│                      │
│ [Manage Assignments] │  ← Manager only
└──────────────────────┘
```

### **Hover Detail Card**
When hovering over a user card, `UserDetailsCard` appears showing:
- User profile details
- Assigned tasks
- Recent activity
- Team information

---

## 🔧 Customization

### **Change Team Filter Options**
Edit `TeamDashboard.jsx`:
```javascript
<select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
  <option value="all">All Teams</option>
  {teams.map((team) => (
    <option key={team._id} value={team._id}>
      {team.name}
    </option>
  ))}
</select>
```

### **Modify Progress Bar Colors**
```javascript
<CircularProgressbar
  value={user.percentage}
  styles={buildStyles({
    pathColor: user.percentage >= 80 ? "#10b981" :  // Green
              user.percentage >= 50 ? "#f59e0b" :  // Yellow
              "#ef4444",                            // Red
    textColor: "#f8f7ec",
    trailColor: "#333"
  })}
/>
```

### **Add Custom Role Icons**
```javascript
const getRoleIcon = (role) => {
  switch (role?.toLowerCase()) {
    case "developer":
      return <Code2 className="text-blue-400" />;
    case "designer":
      return <Palette className="text-pink-400" />;
    case "qa":
      return <Bug className="text-orange-400" />;
    // Add more roles...
  }
};
```

---

## 📈 Performance Statistics

### **Calculation Logic**

**User Stats:**
```javascript
const calculateUserStats = (userId, tasks) => {
  const userTasks = tasks.filter(task => task.assignedTo === userId);
  const completed = userTasks.filter(task => task.status === 'completed').length;
  const total = userTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
};
```

**Team Stats:**
```javascript
const calculateTeamStats = (teamMembers, tasks) => {
  const memberIds = teamMembers.map(m => m._id);
  const teamTasks = tasks.filter(task => memberIds.includes(task.assignedTo));
  const completed = teamTasks.filter(task => task.status === 'completed').length;
  const total = teamTasks.length;
  return { completed, total };
};
```

---

## 🐛 Troubleshooting

### **Issue: No users showing**
**Solution:**
1. Check if user has `teamId` assigned
2. Verify tasks exist in database
3. Check console for API errors
4. Ensure JWT token is valid

### **Issue: Manager can't see all teams**
**Solution:**
1. Verify user role is 'manager' or 'admin'
2. Check backend RBAC logic in `teamController.js`
3. Ensure proper authentication headers

### **Issue: Progress shows 0%**
**Solution:**
1. Verify tasks are assigned to users
2. Check task status field matches enum values
3. Ensure `calculateUserStats` function is working

### **Issue: Team assignment fails**
**Solution:**
1. Verify user has manager role
2. Check team exists in database
3. Ensure user is not already in team
4. Check server logs for errors

---

## 🔒 Security Considerations

### **RBAC Enforcement**
- ✅ Backend validates user role on every request
- ✅ Frontend hides UI elements but backend enforces access
- ✅ JWT tokens required for all API calls
- ✅ User can only update their own assigned tasks

### **Data Validation**
- ✅ Team names must be unique
- ✅ User IDs validated before assignment
- ✅ Project references checked before creation
- ✅ Status values validated against enum

---

## 📝 Next Steps

### **Recommended Enhancements**

1. **Real-Time Updates**
   - Implement WebSocket for live task updates
   - Auto-refresh dashboard when data changes

2. **Advanced Filtering**
   - Filter by completion percentage
   - Sort by name, role, or progress
   - Date range filters for tasks

3. **Bulk Operations**
   - Assign multiple users to team at once
   - Export team data as CSV/PDF
   - Bulk task status updates

4. **Analytics Dashboard**
   - Team performance trends over time
   - Individual user productivity charts
   - Project timeline visualizations

5. **Notifications**
   - Email notifications for task assignments
   - In-app notifications for status changes
   - Daily/weekly progress reports

---

## 📚 Additional Resources

- **Frontend Component:** `/frontend/src/pages/TeamDashboard.jsx`
- **Backend Controllers:** `/server/src/controllers/teamController.js`, `/server/src/controllers/projectController.js`
- **Models:** `/server/src/models/Team.js`, `/server/src/models/Project.js`, `/server/src/models/User.js`
- **Routes:** `/server/src/routes/teamRoutes.js`, `/server/src/routes/projectRoutes.js`

---

## ✅ Checklist

**Backend Setup:**
- [x] Team model created
- [x] Project model created
- [x] User model updated with teamId/projectId
- [x] Team controller with RBAC logic
- [x] Project controller with module management
- [x] Routes registered in server.js
- [x] API endpoints tested

**Frontend Implementation:**
- [x] Dynamic data fetching from API
- [x] RBAC-aware UI rendering
- [x] Team filtering dropdown
- [x] Search functionality
- [x] Performance leaderboard
- [x] User cards with progress
- [x] Hover detail cards
- [x] Team assignment modal (managers)
- [x] Error handling and loading states

**Features:**
- [x] Multi-team support
- [x] Role-based access control
- [x] Task completion tracking
- [x] Team statistics calculation
- [x] User assignment to teams
- [x] Project-team linking

---

**Status:** ✅ **COMPLETE - Ready for Production**

All features implemented, tested, and documented. The Team Dashboard is now fully dynamic with backend integration, RBAC, and multi-team support!
