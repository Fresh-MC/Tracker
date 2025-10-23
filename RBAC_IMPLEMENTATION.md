# RBAC Implementation Guide

## Overview

This document describes the Role-Based Access Control (RBAC) system implemented in the Project Tracker backend. The RBAC system is lightweight, modular, and allows restricting access to specific routes based on user roles.

## Implementation Date
October 23, 2025

## Key Changes

### 1. New Middleware: `rbac.js`

**Location**: `/server/src/middleware/rbac.js`

**Purpose**: Provides `verifyRole(allowedRoles)` middleware function that checks if the authenticated user's role is in the allowed roles array.

**Features**:
- Returns 403 Access denied if user doesn't have required role
- Must be used AFTER authentication middleware (`protect` or `authenticateToken`)
- Supports multiple roles per route
- Clear error messages with role information

**Usage Example**:
```javascript
import { verifyRole } from './middleware/rbac.js';
import { protect } from './middleware/auth.js';

// Single role
router.post('/assignTask', protect, verifyRole(['team_lead']), assignTaskHandler);

// Multiple roles (user must have at least one)
router.post('/assignTask', protect, verifyRole(['team_lead', 'manager', 'admin']), assignTaskHandler);
```

### 2. New Controller Function: `assignTask`

**Location**: `/server/src/controllers/taskController.js`

**Purpose**: Allows authorized users (team_lead, manager, admin) to assign tasks to other users.

**Endpoint**: `POST /api/tasks/assignTask`

**Request Body**:
```json
{
  "taskId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Task Title",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student"
    },
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "username": "manager1",
      "email": "manager@example.com"
    },
    ...
  }
}
```

**Response Error (403)** - Unauthorized role:
```json
{
  "success": false,
  "message": "Access denied. Your role 'student' does not have permission to access this resource.",
  "requiredRoles": ["team_lead", "manager", "admin"],
  "currentRole": "student",
  "error": "INSUFFICIENT_PERMISSIONS"
}
```

**Response Error (404)** - Task not found:
```json
{
  "success": false,
  "message": "Task not found",
  "error": "TASK_NOT_FOUND"
}
```

### 3. Updated User Model

**Location**: `/server/src/models/User.js`

**Changes**: Added new roles to the enum

**Previous Roles**:
- `user` (default)
- `manager`
- `admin`

**New Roles**:
- `student` (default) - Basic user with limited permissions
- `user` - Standard user access
- `team_lead` - Can assign tasks and manage team
- `manager` - Can manage projects and teams
- `admin` - Full access to all resources

```javascript
role: {
  type: String,
  enum: ['student', 'user', 'team_lead', 'manager', 'admin'],
  default: 'student'
}
```

### 4. Route Configuration

**Location**: `/server/src/routes/taskRoutes.js`

**RBAC-Protected Routes**:
```javascript
// RBAC-protected: Only team_lead, manager, admin can assign tasks
router.post('/assignTask', verifyRole(['team_lead', 'manager', 'admin']), assignTask);

// Existing protected routes (manager, admin only)
router.post('/', authorize('manager', 'admin'), createTask);
router.delete('/:id', authorize('manager', 'admin'), deleteTask);

// All authenticated users can access these routes
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.post('/:id/comments', addComment);
```

### 5. Middleware Cleanup

**Location**: `/server/src/middleware/auth.js`

**Changes**: Consolidated duplicate authentication code by making `auth.js` a re-export layer for backward compatibility.

**Before**: Had duplicate `protect` and `authorize` implementations in both `auth.js` and `authenticateToken.js`

**After**: `auth.js` now re-exports from `authenticateToken.js`:
```javascript
import { authenticateToken, requireRole } from './authenticateToken.js';

export const protect = authenticateToken;
export const authorize = requireRole;
```

## Access Control Matrix

| Route | student | user | team_lead | manager | admin |
|-------|---------|------|-----------|---------|-------|
| GET /api/tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/tasks/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/tasks | ❌ | ❌ | ❌ | ✅ | ✅ |
| PUT /api/tasks/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| DELETE /api/tasks/:id | ❌ | ❌ | ❌ | ✅ | ✅ |
| POST /api/tasks/:id/comments | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POST /api/tasks/assignTask** | ❌ | ❌ | ✅ | ✅ | ✅ |
| GET /api/auth/me | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/users | ❌ | ❌ | ❌ | ✅ | ✅ |
| GET /api/users/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /api/users/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| DELETE /api/users/:id | ❌ | ❌ | ❌ | ❌ | ✅ |

## Testing Results

### Test 1: Student Role (Should Fail)
```bash
curl -X POST http://localhost:3000/api/tasks/assignTask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{"taskId":"507f1f77bcf86cd799439011","userId":"507f1f77bcf86cd799439012"}'
```

**Result**: ✅ PASS
```json
{
  "success": false,
  "message": "Access denied. Your role 'student' does not have permission to access this resource.",
  "requiredRoles": ["team_lead", "manager", "admin"],
  "currentRole": "student",
  "error": "INSUFFICIENT_PERMISSIONS"
}
```

### Test 2: Team Lead Role (Should Succeed - Access Granted)
```bash
curl -X POST http://localhost:3000/api/tasks/assignTask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teamlead_token>" \
  -d '{"taskId":"507f1f77bcf86cd799439011","userId":"507f1f77bcf86cd799439012"}'
```

**Result**: ✅ PASS
```json
{
  "success": false,
  "message": "Task not found",
  "error": "TASK_NOT_FOUND"
}
```
*Note: Returns "Task not found" because test used fake task ID, but RBAC check passed (no 403 error).*

### Test 3: Student Accessing Regular Routes (Should Succeed)
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <student_token>"
```

**Result**: ✅ PASS
```json
{
  "success": true,
  "count": 0,
  "tasks": []
}
```

### Test 4: Student Accessing Profile (Should Succeed)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <student_token>"
```

**Result**: ✅ PASS
```json
{
  "success": true,
  "user": {
    "_id": "68fa30f8af1f73e03867141e",
    "username": "student1",
    "email": "student@test.com",
    "role": "student",
    "profilePicture": null,
    "isActive": true,
    "lastLogin": "2025-10-23T13:44:30.178Z",
    "createdAt": "2025-10-23T13:43:20.945Z"
  }
}
```

## Frontend Compatibility

✅ **No frontend changes required**

The frontend continues to work without modification because:
1. All existing routes remain accessible to authenticated users
2. Login/registration flow unchanged
3. JWT token handling unchanged
4. Only the new `/assignTask` endpoint has role restrictions
5. Frontend routing is not restricted (as per requirements)

**Frontend URL**: http://localhost:5173

**Verified Routes**:
- Dashboard: Accessible to all authenticated users
- Project Plan: Accessible to all authenticated users
- Tasks: Accessible to all authenticated users
- Team Dashboard: Accessible to all authenticated users
- Profile: Accessible to all authenticated users

## Files Modified

### Created
- `/server/src/middleware/rbac.js` - New RBAC middleware

### Modified
- `/server/src/controllers/taskController.js` - Added `assignTask` function
- `/server/src/routes/taskRoutes.js` - Added `/assignTask` route with RBAC
- `/server/src/models/User.js` - Added `student` and `team_lead` roles
- `/server/src/middleware/auth.js` - Cleaned up duplicate code

### No Changes Required
- Frontend files (React + Vite)
- Other backend routes
- Authentication flow
- JWT token generation/verification

## How to Use

### 1. Register a User with Specific Role
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teamlead1",
    "email": "teamlead@test.com",
    "password": "test1234",
    "role": "team_lead"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teamlead@test.com",
    "password": "test1234"
  }'
```

### 3. Use Token to Assign Task
```bash
curl -X POST http://localhost:3000/api/tasks/assignTask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "taskId": "actual_task_id",
    "userId": "actual_user_id"
  }'
```

## Adding RBAC to More Routes

To add role-based access control to additional routes:

```javascript
import { verifyRole } from '../middleware/rbac.js';
import { protect } from '../middleware/auth.js';

// Example: Only managers can approve tasks
router.post('/:id/approve', protect, verifyRole(['manager', 'admin']), approveTask);

// Example: Only team leads can reassign tasks
router.post('/:id/reassign', protect, verifyRole(['team_lead', 'manager', 'admin']), reassignTask);
```

## Best Practices

1. **Always use `protect` middleware first**: Ensure user is authenticated before checking roles
2. **Use descriptive role names**: Make roles self-explanatory (student, team_lead, manager, admin)
3. **Provide clear error messages**: Include required roles and current role in 403 responses
4. **Keep role hierarchy consistent**: student < user < team_lead < manager < admin
5. **Document protected routes**: Maintain access control matrix for all routes
6. **Test all roles**: Verify both authorized and unauthorized access for each protected route

## Security Considerations

1. ✅ JWT tokens are verified before role check
2. ✅ User existence and active status verified
3. ✅ Role-based access control at middleware level
4. ✅ Clear separation between authentication and authorization
5. ✅ No sensitive data in error messages
6. ✅ All protected routes require valid JWT token

## Future Enhancements

- [ ] Permission-based access control (more granular than roles)
- [ ] Dynamic role assignment via admin dashboard
- [ ] Role inheritance and hierarchies
- [ ] Audit logging for role-based access attempts
- [ ] Frontend route guarding based on user role
- [ ] Role-based UI component rendering

## Troubleshooting

### 403 Error When Expected to Work
- Verify user's role: `GET /api/auth/me`
- Check if role is in allowed roles array
- Ensure `protect` middleware is before `verifyRole`

### All Requests Return 401
- Check JWT token is valid and not expired
- Verify token is in Authorization header: `Bearer <token>`
- Ensure backend server is running

### Role Not Updating
- Role is set during registration
- Cannot be changed via normal update endpoints (requires admin)
- Re-login to get new token with updated role

## Support

For questions or issues with RBAC implementation:
1. Check this documentation
2. Review `/server/src/middleware/rbac.js` comments
3. Test with curl commands provided above
4. Check server logs for detailed error messages

---

**Implementation Status**: ✅ Complete and Tested
**Last Updated**: October 23, 2025
**Version**: 1.0.0
