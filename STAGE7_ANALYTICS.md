# Stage 7: Analytics, Reporting, and Insights

**Status**: ✅ Complete  
**Date**: October 24, 2025  
**Author**: Fresh-MC  
**Dependencies**: Stage 6 (Real-time Validation System)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Components](#frontend-components)
5. [MongoDB Aggregation Queries](#mongodb-aggregation-queries)
6. [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
7. [Real-time Updates](#real-time-updates)
8. [API Documentation](#api-documentation)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Stage 7 builds on Stage 6's real-time validation system by introducing comprehensive analytics, reporting, and insights capabilities. The system tracks task completion metrics, visualizes progress trends, detects bottlenecks, and provides role-based dashboards with live updates.

### Key Features

✅ **Performance Metrics**
- Tasks completed per user, project, and team
- Historical trends (daily, weekly, monthly)
- Module completion percentages
- Average completion time tracking
- Pending and blocked task identification

✅ **Visualization**
- Interactive charts (line, bar, pie, area)
- Timeline progress tracking with on-track indicators
- Team velocity metrics (4-week trends)
- Leaderboard rankings with completion rates

✅ **Insights & Alerts**
- Overdue module detection (>14 days threshold)
- At-risk team member identification
- Low completion rate warnings
- Real-time activity monitoring

✅ **Export Functionality**
- CSV export for team performance data
- Includes leaderboard, completion rates, avg times
- Timestamped file naming

✅ **Enhanced RBAC**
- **Managers/Admins**: Full analytics access across all teams
- **Team Leads**: Team-specific analytics only
- **Users**: Personal task stats and progress

✅ **Real-time Updates**
- Socket.IO integration for live chart updates
- Automatic refresh on module completion
- No page reload required

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Analytics      │  │  Project        │  │  Team       │ │
│  │  Dashboard      │  │  Analytics      │  │  Analytics  │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┼───────────────────┘        │
│                                │                            │
│                         Recharts Library                    │
│                         Socket.IO Client                    │
└────────────────────────────────┼───────────────────────────┘
                                 │
                          HTTPS/WSS
                                 │
┌────────────────────────────────┼───────────────────────────┐
│                     Backend (Node.js + Express)             │
│  ┌─────────────────────────────┼──────────────────────┐    │
│  │         Analytics Routes    │                      │    │
│  │  /api/analytics/summary     │                      │    │
│  │  /api/analytics/projects/:id│                      │    │
│  │  /api/analytics/teams/:id   │                      │    │
│  │  /api/analytics/users/:id   │                      │    │
│  └─────────────────┬───────────┘                      │    │
│                    │                                   │    │
│           ┌────────▼─────────┐                        │    │
│           │  Analytics       │   ◄────RBAC Filter─────┤    │
│           │  Controller      │                        │    │
│           └────────┬─────────┘                        │    │
│                    │                                   │    │
│  ┌─────────────────▼──────────────┐                   │    │
│  │   MongoDB Aggregation          │                   │    │
│  │   - Group by status/user       │                   │    │
│  │   - Calculate completion rates │                   │    │
│  │   - Generate trend data        │                   │    │
│  │   - Compute velocity metrics   │                   │    │
│  └────────────────────────────────┘                   │    │
│                                                        │    │
│  ┌────────────────────────────────┐                   │    │
│  │   Socket.IO Server             │                   │    │
│  │   - module_updated event       │                   │    │
│  │   - task_validated event       │                   │    │
│  └────────────────────────────────┘                   │    │
└────────────────────────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼───────────────────────────┐
│                     MongoDB Atlas                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Projects   │  │    Teams     │  │    Users     │     │
│  │  Collection  │  │  Collection  │  │  Collection  │     │
│  │              │  │              │  │              │     │
│  │  - modules[] │  │  - members[] │  │  - role      │     │
│  │  - teamId    │  │  - projectId │  │  - teamId    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend**
- Node.js + Express.js (REST API)
- MongoDB + Mongoose (Database & ODM)
- JWT (Authentication)
- Socket.IO (Real-time events)

**Frontend**
- React 19.1.0 (UI framework)
- Recharts 3.3.0 (Data visualization)
- axios (HTTP client)
- lucide-react (Icons)
- Tailwind CSS (Styling)

**Database**
- MongoDB Atlas (Cloud database)
- Aggregation pipelines (Analytics queries)

---

## Backend Implementation

### File Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── analyticsController.js    # Analytics logic
│   ├── routes/
│   │   └── analyticsRoutes.js        # API endpoints
│   ├── middleware/
│   │   └── auth.js                   # JWT protection
│   └── server.js                     # Route registration
├── validation_engine.py              # Socket.IO event emissions
├── test_stage7_analytics.sh          # Test suite
└── package.json
```

### Analytics Controller (`analyticsController.js`)

Located at: `server/src/controllers/analyticsController.js`

**Functions:**

#### 1. `getProjectAnalytics(req, res)`
Provides comprehensive project-level analytics.

**Endpoint**: `GET /api/analytics/projects/:projectId`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "...",
      "name": "Project Name",
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    },
    "overview": {
      "totalModules": 50,
      "completedModules": 35,
      "inProgressModules": 10,
      "blockedModules": 5,
      "completionRate": 70,
      "avgCompletionTime": 7.5
    },
    "modulesByStatus": {
      "completed": 35,
      "in-progress": 10,
      "blocked": 5,
      "not-started": 0
    },
    "modulesByAssignee": [
      {
        "userId": "...",
        "username": "john_doe",
        "total": 10,
        "completed": 7,
        "inProgress": 2,
        "blocked": 1
      }
    ],
    "timelineProgress": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "currentDate": "2025-10-24",
      "daysElapsed": 297,
      "totalDays": 365,
      "timeProgress": 81,
      "completionProgress": 70,
      "onTrack": false,
      "daysRemaining": 68
    },
    "overdueModules": [
      {
        "id": "...",
        "title": "Module X",
        "assignedTo": "john_doe",
        "status": "in-progress",
        "daysInProgress": 21
      }
    ],
    "completionTrend": [
      { "date": "2025-10-01", "completed": 2 },
      { "date": "2025-10-02", "completed": 1 },
      ...
    ]
  }
}
```

**RBAC**:
- Managers/Admins: Access any project
- Team Leads: Access only their team's projects
- Users: Access projects they're assigned to

**Calculations**:
- `completionRate = (completedModules / totalModules) * 100`
- `avgCompletionTime = Σ(completedAt - createdAt) / completedCount` (in days)
- `timeProgress = (currentDate - startDate) / (endDate - startDate) * 100`
- `onTrack = completionRate >= timeProgress - 10%` (10% tolerance)
- `overdueModules = modules with status in-progress/blocked for >14 days`

---

#### 2. `getTeamAnalytics(req, res)`
Provides team performance metrics and leaderboard.

**Endpoint**: `GET /api/analytics/teams/:teamId`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "team": {
      "_id": "...",
      "name": "Team Alpha",
      "memberCount": 5,
      "project": "Project Name"
    },
    "overview": {
      "totalModules": 100,
      "completedModules": 70,
      "inProgressModules": 20,
      "blockedModules": 10,
      "completionRate": 70,
      "projectCount": 2
    },
    "leaderboard": [
      {
        "user": {
          "_id": "...",
          "username": "alice",
          "email": "alice@example.com",
          "role": "user",
          "avatar": "..."
        },
        "totalTasks": 25,
        "tasksCompleted": 22,
        "tasksInProgress": 2,
        "tasksBlocked": 1,
        "completionRate": 88,
        "avgCompletionTime": 5.2
      },
      ...
    ],
    "velocity": [
      { "week": "Week 1", "completed": 8 },
      { "week": "Week 2", "completed": 12 },
      { "week": "Week 3", "completed": 10 },
      { "week": "Week 4", "completed": 15 }
    ],
    "avgVelocity": 11.25,
    "atRiskMembers": [
      {
        "username": "bob",
        "completionRate": 40,
        "tasksBlocked": 3,
        "reason": "Low completion rate (40%)"
      }
    ]
  }
}
```

**RBAC**:
- Managers/Admins: Access any team
- Team Leads: Access only their own team
- Users: No access to team analytics

**Calculations**:
- `leaderboard`: Sorted by completionRate (primary), then tasksCompleted (secondary)
- `velocity`: Modules completed per week for last 4 weeks
- `avgVelocity`: Average of last 4 weeks
- `atRiskMembers`: completionRate < 50% OR tasksBlocked > 2

---

#### 3. `getUserAnalytics(req, res)`
Provides personal analytics for individual users.

**Endpoint**: `GET /api/analytics/users/:userId`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    },
    "overview": {
      "totalModules": 15,
      "completedModules": 10,
      "inProgressModules": 3,
      "blockedModules": 2,
      "completionRate": 67,
      "avgCompletionTime": 6.8
    },
    "projectBreakdown": [
      {
        "projectId": "...",
        "projectName": "Project A",
        "total": 8,
        "completed": 6,
        "inProgress": 1,
        "blocked": 1
      },
      ...
    ],
    "activityTrend": [
      { "date": "2025-10-01", "completed": 1 },
      { "date": "2025-10-02", "completed": 0 },
      ...
    ],
    "recentCompletions": [
      {
        "moduleTitle": "Module X",
        "projectName": "Project A",
        "completedAt": "2025-10-20T10:30:00Z",
        "completionTime": 5.2
      },
      ...
    ]
  }
}
```

**RBAC**:
- Users: Access own analytics only
- Team Leads: Access analytics for team members
- Managers/Admins: Access any user's analytics

---

#### 4. `getSummaryAnalytics(req, res)`
Provides dashboard-wide overview with role-based filtering.

**Endpoint**: `GET /api/analytics/summary`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProjects": 10,
      "activeProjects": 7,
      "completedProjects": 3,
      "totalModules": 250,
      "completedModules": 175,
      "inProgressModules": 50,
      "blockedModules": 25,
      "completionRate": 70
    },
    "recentActivity": {
      "last7Days": 15
    },
    "alerts": [
      {
        "type": "warning",
        "priority": "high",
        "message": "25 blocked modules require attention"
      },
      {
        "type": "info",
        "priority": "medium",
        "message": "70% overall completion rate"
      }
    ],
    "topPerformers": [
      {
        "userId": "...",
        "username": "alice",
        "tasksCompleted": 45
      },
      ...
    ],
    "accessLevel": "full"
  }
}
```

**RBAC Data Filtering**:
- **Managers/Admins**: `accessLevel: "full"` - All projects, all users
- **Team Leads**: `accessLevel: "team"` - Only their team's projects
- **Users**: `accessLevel: "personal"` - Only projects they're assigned to

**Alert Types**:
- `warning`: Blocked modules, low completion rate
- `info`: Overall metrics, activity levels
- `success`: Good progress (≥70% completion)

---

### Analytics Routes (`analyticsRoutes.js`)

Located at: `server/src/routes/analyticsRoutes.js`

```javascript
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getProjectAnalytics,
  getTeamAnalytics,
  getUserAnalytics,
  getSummaryAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// All routes require authentication
router.get('/summary', protect, getSummaryAnalytics);
router.get('/projects/:projectId', protect, getProjectAnalytics);
router.get('/teams/:teamId', protect, getTeamAnalytics);
router.get('/users/:userId', protect, getUserAnalytics);

export default router;
```

**Authentication**: All routes protected with JWT via `protect` middleware

**Route Registration** (in `server.js`):
```javascript
import analyticsRoutes from './routes/analyticsRoutes.js';
app.use('/api/analytics', analyticsRoutes);
```

---

## Frontend Components

### File Structure

```
frontend/src/
├── pages/
│   ├── AnalyticsDashboard.jsx    # Main analytics overview
│   ├── ProjectAnalytics.jsx      # Project-specific view
│   └── TeamAnalytics.jsx         # Team performance view
├── hooks/
│   └── useSocket.js              # Socket.IO hook (Stage 6)
└── App.jsx                       # Route configuration
```

### Routes Configuration (`App.jsx`)

```javascript
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ProjectAnalytics from './pages/ProjectAnalytics';
import TeamAnalytics from './pages/TeamAnalytics';

// In Routes:
<Route path="/analytics" element={
  <ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>
} />

<Route path="/projects/:projectId/analytics" element={
  <ProtectedRoute><ProjectAnalytics /></ProtectedRoute>
} />

<Route path="/teams/:teamId/analytics" element={
  <ProtectedRoute><TeamAnalytics /></ProtectedRoute>
} />
```

---

### 1. AnalyticsDashboard Component

**File**: `frontend/src/pages/AnalyticsDashboard.jsx`

**Purpose**: Main analytics overview for all authenticated users with role-based data filtering.

**Features**:
- 4 KPI cards (Projects, Modules, Completion Rate, Recent Activity)
- Alert system (warnings, info, success messages)
- Pie chart (module status distribution)
- Bar chart (project overview)
- Top performers table (managers/team_leads only)
- Real-time Socket.IO updates

**Key Code Patterns**:

```javascript
// Data fetching with JWT
const fetchAnalytics = useCallback(async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/api/analytics/summary`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setAnalyticsData(response.data.data);
}, []);

// Real-time updates
useEffect(() => {
  if (!socket) return;
  
  const handleUpdate = () => fetchAnalytics();
  
  socket.on('module_updated', handleUpdate);
  socket.on('task_validated', handleUpdate);
  
  return () => {
    socket.off('module_updated', handleUpdate);
    socket.off('task_validated', handleUpdate);
  };
}, [socket, fetchAnalytics]);

// Recharts usage
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie data={statusData} dataKey="value" nameKey="name" />
  </PieChart>
</ResponsiveContainer>
```

**Props**: None (uses global auth context)

**State**:
- `analyticsData`: API response data
- `loading`: Loading state
- `error`: Error message

---

### 2. ProjectAnalytics Component

**File**: `frontend/src/pages/ProjectAnalytics.jsx`

**Purpose**: Detailed project-specific analytics with timeline tracking.

**Features**:
- Project header with back navigation
- 4 overview cards (Total, Completed, Rate, Avg Time)
- Timeline progress with dual progress bars
- On-track indicator (green check or red warning)
- Overdue modules alert (>14 days)
- Pie chart (module status)
- Area chart (30-day completion trend)
- Team member contribution table
- Real-time updates filtered by projectId

**Key Code Patterns**:

```javascript
// URL parameter extraction
const { projectId } = useParams();
const navigate = useNavigate();

// Project-specific Socket.IO filtering
const handleModuleUpdate = (data) => {
  if (data.projectId === projectId) {
    fetchAnalytics();
  }
};

// Timeline progress display
const { timelineProgress } = analyticsData;
<div className="w-full bg-gray-200 rounded-full h-3">
  <div 
    className="bg-blue-500 h-3 rounded-full"
    style={{ width: `${timelineProgress.timeProgress}%` }}
  />
</div>
<div 
  className="bg-green-500 h-3 rounded-full"
  style={{ width: `${timelineProgress.completionProgress}%` }}
/>
{timelineProgress.onTrack ? <Check /> : <AlertCircle />}
```

**Navigation**:
- Back button: `navigate(-1)`
- Access: `/projects/:projectId/analytics`

---

### 3. TeamAnalytics Component

**File**: `frontend/src/pages/TeamAnalytics.jsx`

**Purpose**: Team performance metrics with leaderboard and CSV export.

**Features**:
- Team header with export button
- 4 overview cards (Total, Completion Rate, Velocity, Projects)
- At-risk members alert
- Line chart (team velocity - 4 weeks)
- Bar chart (top 5 contributors)
- Full leaderboard table with rankings
- CSV export functionality
- Real-time updates

**Key Code Patterns**:

```javascript
// CSV Export
const exportToCSV = () => {
  const headers = ['Rank', 'Username', 'Completed', ...];
  const rows = leaderboard.map((member, index) => [
    index + 1,
    member.user.username,
    member.tasksCompleted,
    ...
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${team.name}_analytics_${date}.csv`;
  link.click();
};

// Leaderboard with rank badges
{leaderboard.map((member, index) => (
  <tr>
    <td>
      <span className={index < 3 ? 'bg-yellow-100' : 'bg-gray-50'}>
        {index + 1}
      </span>
    </td>
    ...
  </tr>
))}
```

**Export Format** (CSV):
```
Rank,Username,Email,Role,Completed,In Progress,Blocked,Total,Rate,Avg Time
1,alice,alice@ex.com,user,22,2,1,25,88,5.2
2,bob,bob@ex.com,user,18,4,2,24,75,6.1
...
```

---

## MongoDB Aggregation Queries

### Completion Rate Calculation

```javascript
const completedModules = project.modules.filter(m => m.status === 'completed').length;
const totalModules = project.modules.length;
const completionRate = totalModules > 0 
  ? Math.round((completedModules / totalModules) * 100) 
  : 0;
```

### Average Completion Time

```javascript
const completionTimes = project.modules
  .filter(m => m.status === 'completed' && m.createdAt && m.completedAt)
  .map(m => {
    const created = new Date(m.createdAt);
    const completed = new Date(m.completedAt);
    return (completed - created) / (1000 * 60 * 60 * 24); // Days
  });

const avgCompletionTime = completionTimes.length > 0
  ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
  : 0;
```

### 30-Day Completion Trend

```javascript
const trend = [];
for (let i = 29; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];
  
  const completed = project.modules.filter(m => 
    m.status === 'completed' &&
    m.completedAt &&
    new Date(m.completedAt).toISOString().split('T')[0] === dateStr
  ).length;
  
  trend.push({ date: dateStr, completed });
}
```

### Team Velocity (4 Weeks)

```javascript
const velocity = [];
for (let week = 0; week < 4; week++) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() - week * 7);
  
  const completed = projects.reduce((sum, project) => {
    return sum + project.modules.filter(m =>
      m.status === 'completed' &&
      new Date(m.completedAt) >= weekStart &&
      new Date(m.completedAt) < weekEnd
    ).length;
  }, 0);
  
  velocity.unshift({ week: `Week ${4 - week}`, completed });
}
```

### Leaderboard Sorting

```javascript
const leaderboard = memberStats.sort((a, b) => {
  // Primary: Completion rate (descending)
  if (b.completionRate !== a.completionRate) {
    return b.completionRate - a.completionRate;
  }
  // Secondary: Tasks completed (descending)
  return b.tasksCompleted - a.tasksCompleted;
});
```

---

## RBAC (Role-Based Access Control)

### Access Matrix

| Endpoint | Manager/Admin | Team Lead | User |
|----------|---------------|-----------|------|
| `GET /analytics/summary` | All data | Team data | Personal data |
| `GET /analytics/projects/:id` | Any project | Team projects | Assigned projects |
| `GET /analytics/teams/:id` | Any team | Own team | ❌ Denied |
| `GET /analytics/users/:id` | Any user | Team members | Own data |

### Implementation

**Backend (Controller Level)**:

```javascript
// Example: getProjectAnalytics RBAC
const user = req.user; // From JWT
const project = await Project.findById(projectId).populate('teamId');

// Check access
const isManager = ['manager', 'admin'].includes(user.role);
const isTeamLead = user.role === 'team_lead' && 
                   user.teamId?.toString() === project.teamId?._id?.toString();
const isMember = project.modules.some(m => 
                   m.assignedToUserId?.toString() === user._id.toString());

if (!isManager && !isTeamLead && !isMember) {
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied' 
  });
}
```

**Frontend (Display Level)**:

```javascript
// Show top performers only for managers/team_leads
{analyticsData.accessLevel !== 'personal' && (
  <TopPerformersTable data={analyticsData.topPerformers} />
)}
```

### Role Definitions

- **manager**: Full system access, all analytics
- **admin**: Same as manager (system administrator)
- **team_lead**: Team-specific access, can view team analytics
- **user**: Personal access only, own task stats
- **student**: Same as user (alternative role name)

---

## Real-time Updates

### Socket.IO Integration

**Backend Event Emission** (`validation_engine.py`):

```python
# After module validation/completion
socketio.emit('module_updated', {
    'projectId': str(project['_id']),
    'teamId': str(project.get('teamId')),
    'userId': str(module['assignedToUserId']),
    'action': 'module_completed',
    'moduleId': str(module['_id']),
    'status': module['status'],
    'timestamp': datetime.utcnow().isoformat()
})
```

**Frontend Event Listening** (React hook):

```javascript
import useSocket from '../hooks/useSocket';

const socket = useSocket();

useEffect(() => {
  if (!socket) return;
  
  const handleUpdate = (data) => {
    console.log('Module updated:', data);
    fetchAnalytics(); // Re-fetch data
  };
  
  socket.on('module_updated', handleUpdate);
  socket.on('task_validated', handleUpdate);
  
  return () => {
    socket.off('module_updated', handleUpdate);
    socket.off('task_validated', handleUpdate);
  };
}, [socket, fetchAnalytics]);
```

**Project-Specific Filtering**:

```javascript
const handleModuleUpdate = (data) => {
  // Only refresh if update is for current project
  if (data.projectId === projectId) {
    fetchAnalytics();
  }
};
```

### Event Types

| Event | Trigger | Data |
|-------|---------|------|
| `module_updated` | Module status change | projectId, teamId, userId, status |
| `task_validated` | GitHub validation complete | projectId, moduleId, action |

---

## API Documentation

### Base URL

```
Production: https://your-domain.com/api/analytics
Development: http://localhost:3000/api/analytics
```

### Authentication

All endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### 1. Get Summary Analytics

**Request**:
```http
GET /api/analytics/summary
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "overview": { ... },
    "recentActivity": { ... },
    "alerts": [ ... ],
    "topPerformers": [ ... ],
    "accessLevel": "full" | "team" | "personal"
  }
}
```

**Errors**:
- 401: Unauthorized (missing/invalid token)
- 500: Server error

---

#### 2. Get Project Analytics

**Request**:
```http
GET /api/analytics/projects/:projectId
Authorization: Bearer <token>
```

**Parameters**:
- `projectId`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "project": { ... },
    "overview": { ... },
    "modulesByStatus": { ... },
    "modulesByAssignee": [ ... ],
    "timelineProgress": { ... },
    "overdueModules": [ ... ],
    "completionTrend": [ ... ]
  }
}
```

**Errors**:
- 400: Invalid project ID
- 403: Access denied (not project member)
- 404: Project not found
- 500: Server error

---

#### 3. Get Team Analytics

**Request**:
```http
GET /api/analytics/teams/:teamId
Authorization: Bearer <token>
```

**Parameters**:
- `teamId`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "team": { ... },
    "overview": { ... },
    "leaderboard": [ ... ],
    "velocity": [ ... ],
    "avgVelocity": 11.25,
    "atRiskMembers": [ ... ]
  }
}
```

**Errors**:
- 400: Invalid team ID
- 403: Access denied (not team member/lead)
- 404: Team not found
- 500: Server error

---

#### 4. Get User Analytics

**Request**:
```http
GET /api/analytics/users/:userId
Authorization: Bearer <token>
```

**Parameters**:
- `userId`: MongoDB ObjectId

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "overview": { ... },
    "projectBreakdown": [ ... ],
    "activityTrend": [ ... ],
    "recentCompletions": [ ... ]
  }
}
```

**Errors**:
- 400: Invalid user ID
- 403: Access denied (not own data/team lead/manager)
- 404: User not found
- 500: Server error

---

## Testing

### Test Suite (`test_stage7_analytics.sh`)

Located at: `server/test_stage7_analytics.sh`

**Make executable**:
```bash
chmod +x test_stage7_analytics.sh
```

**Run tests**:
```bash
./test_stage7_analytics.sh
```

### Test Categories

1. **Server Health Check**: Verify backend is running
2. **Authentication Tests**: Unauthenticated/invalid token rejection
3. **Summary Analytics**: Manager access, response structure
4. **Project Analytics**: Valid/invalid IDs, RBAC enforcement
5. **Team Analytics**: Valid/invalid IDs, data structure
6. **User Analytics**: Personal data access
7. **RBAC Tests**: Unauthorized access attempts (403 responses)
8. **Performance Tests**: Response time measurement
9. **Data Integrity**: Completion rate calculation verification

### Configuration

**Update tokens** (login as each role, copy from localStorage):
```bash
MANAGER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TEAM_LEAD_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Update test IDs** (get from MongoDB):
```bash
PROJECT_ID="6710d8e7f0c3a2b4e8f91234"
TEAM_ID="6710d8e7f0c3a2b4e8f91235"
USER_ID="6710d8e7f0c3a2b4e8f91236"
```

### Expected Output

```
========================================
Test Summary
========================================

Tests Run:    25
Tests Passed: 25
Tests Failed: 0

✓ All tests passed!
```

---

## Deployment

### Environment Variables

**Backend** (`.env`):
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trackerdemo
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=production
```

**Frontend** (`.env`):
```bash
VITE_API_URL=https://your-backend-domain.com
```

### Build & Deploy

**Backend**:
```bash
cd server
npm install
npm run build  # If using TypeScript
npm start
```

**Frontend**:
```bash
cd frontend
npm install
npm run build
# Deploy dist/ folder to hosting (Vercel/Netlify/etc.)
```

### Database Indexes (Performance)

Recommended MongoDB indexes for analytics queries:

```javascript
// Projects collection
db.projects.createIndex({ "teamId": 1 });
db.projects.createIndex({ "modules.assignedToUserId": 1 });
db.projects.createIndex({ "modules.status": 1 });
db.projects.createIndex({ "modules.completedAt": 1 });
db.projects.createIndex({ "modules.createdAt": 1 });

// Users collection
db.users.createIndex({ "teamId": 1 });
db.users.createIndex({ "role": 1 });

// Teams collection
db.teams.createIndex({ "members": 1 });
```

**Create indexes**:
```bash
mongosh "mongodb+srv://cluster.mongodb.net/trackerdemo" --username user
> use trackerdemo
> db.projects.createIndex({ "teamId": 1 })
...
```

### Performance Optimization

1. **Enable MongoDB Connection Pooling**:
```javascript
// server/src/config/database.js
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```

2. **Enable Frontend Caching**:
```javascript
// Cache analytics data for 1 minute
const [cacheTime, setCacheTime] = useState(Date.now());

useEffect(() => {
  const now = Date.now();
  if (now - cacheTime > 60000) { // 1 minute
    fetchAnalytics();
    setCacheTime(now);
  }
}, [cacheTime]);
```

3. **Limit Aggregation Results**:
```javascript
// Only fetch last 30 days of trends
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
```

---

## Troubleshooting

### Common Issues

#### 1. "401 Unauthorized" on API Calls

**Cause**: Missing or expired JWT token

**Solution**:
```javascript
// Check token in localStorage
const token = localStorage.getItem('token');
console.log('Token:', token);

// Verify token expiration
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));

// Re-login if expired
if (Date.now() >= payload.exp * 1000) {
  // Redirect to login
}
```

---

#### 2. Charts Not Rendering

**Cause**: Missing data or incorrect data format

**Solution**:
```javascript
// Check data structure
console.log('Analytics Data:', analyticsData);

// Ensure arrays exist
const statusData = analyticsData?.modulesByStatus 
  ? Object.entries(analyticsData.modulesByStatus).map(...)
  : [];

// Conditional rendering
{statusData.length > 0 ? (
  <PieChart>...</PieChart>
) : (
  <div>No data available</div>
)}
```

---

#### 3. Real-time Updates Not Working

**Cause**: Socket.IO connection failure

**Solution**:
```javascript
// Check socket connection
console.log('Socket connected:', socket?.connected);

// Verify backend Socket.IO server
// server/src/server.js
const io = socketIO(server, {
  cors: { origin: "*" }
});

// Test event emission
socket.emit('test', { message: 'Hello' });
socket.on('test', (data) => console.log(data));
```

---

#### 4. "403 Forbidden" on Team/Project Analytics

**Cause**: RBAC restrictions

**Solution**:
- Verify user role: `console.log('User role:', req.user.role)`
- Check team membership: `console.log('User teamId:', req.user.teamId)`
- For project access: Ensure user is assigned to modules in that project
- Managers/admins bypass restrictions

---

#### 5. Slow Analytics Queries

**Cause**: Missing indexes or large datasets

**Solution**:
1. Add MongoDB indexes (see Deployment section)
2. Limit date ranges:
```javascript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

project.modules.filter(m => 
  new Date(m.completedAt) >= thirtyDaysAgo
);
```
3. Use pagination for leaderboards:
```javascript
const leaderboard = memberStats
  .sort(...)
  .slice(0, 50); // Top 50 only
```

---

#### 6. CSV Export Not Downloading

**Cause**: Browser blocking popup or incorrect blob creation

**Solution**:
```javascript
// Ensure blob is created correctly
const blob = new Blob([csvContent], { 
  type: 'text/csv;charset=utf-8;' 
});

// Use download attribute
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `export_${Date.now()}.csv`;
link.style.display = 'none';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(link.href); // Cleanup
```

---

## Next Steps (Stage 8)

Potential enhancements for future stages:

1. **Advanced Exports**
   - PDF reports with charts (jsPDF + html2canvas)
   - Excel exports with formatting (xlsx library)
   - Scheduled email reports

2. **Predictive Analytics**
   - Estimated completion dates using ML
   - Risk prediction models
   - Resource allocation suggestions

3. **Custom Dashboards**
   - Drag-and-drop dashboard builder
   - Custom metric definitions
   - Saved dashboard configurations

4. **Enhanced Visualizations**
   - Gantt charts for project timelines
   - Heat maps for activity patterns
   - Network graphs for dependencies

5. **Mobile Optimization**
   - Responsive chart resizing
   - Touch-friendly interactions
   - Progressive Web App (PWA)

---

## Support

For issues or questions:
- GitHub: [Fresh-MC/Tracker](https://github.com/Fresh-MC/Tracker)
- Documentation: [README.md](./README.md)
- Backend Tests: `./test_stage7_analytics.sh`

---

**Stage 7 Complete** ✅  
All analytics features implemented, tested, and documented.
