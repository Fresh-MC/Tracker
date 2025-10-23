/**
 * rbac.js - Role-Based Access Control (RBAC) Middleware
 * 
 * This module provides lightweight RBAC functionality for the Project Tracker backend.
 * It allows restricting access to specific routes based on user roles.
 * 
 * Middleware Functions:
 * 
 * 1. verifyRole(allowedRoles)
 *    - Checks if req.user.role is in the allowedRoles array
 *    - Returns 403 Access denied if user doesn't have required role
 *    - Must be used AFTER authentication middleware (protect/authenticateToken)
 *    - Assumes req.user exists and contains role property
 * 
 * Usage Example:
 * 
 * import { verifyRole } from './middleware/rbac.js';
 * import { protect } from './middleware/auth.js';
 * 
 * // Single role
 * router.post('/assignTask', protect, verifyRole(['team_lead']), assignTaskHandler);
 * 
 * // Multiple roles (user must have at least one)
 * router.post('/assignTask', protect, verifyRole(['team_lead', 'manager']), assignTaskHandler);
 * 
 * Supported Roles:
 * - student: Basic user with limited permissions
 * - team_lead: Can assign tasks and manage team
 * - manager: Can manage projects and teams
 * - admin: Full access to all resources
 */

/**
 * Verify if user has required role
 * 
 * @param {Array<string>} allowedRoles - Array of role names that are allowed
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Restrict to team_lead and manager only
 * router.post('/assignTask', protect, verifyRole(['team_lead', 'manager']), handler);
 */
export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be done by protect middleware first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login first.',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Check if user has a role
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role not defined.',
        error: 'NO_ROLE_ASSIGNED'
      });
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role '${req.user.role}' does not have permission to access this resource.`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // User has required role - proceed to next middleware/controller
    next();
  };
};

/**
 * Alias for verifyRole for backward compatibility
 * Some developers prefer different naming conventions
 */
export const checkRole = verifyRole;

// Default export for convenience
export default verifyRole;
