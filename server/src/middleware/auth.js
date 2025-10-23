/**
 * auth.js - Authentication Middleware (Backward Compatibility Layer)
 * 
 * This file re-exports authentication functions from authenticateToken.js
 * to maintain backward compatibility with existing code.
 * 
 * All routes should use these exports:
 * - protect: Verify JWT token and attach user to request
 * - authorize: Require specific role(s) to access route
 * 
 * For new RBAC functionality, import verifyRole from rbac.js
 */

import { authenticateToken, requireRole } from './authenticateToken.js';

/**
 * Re-export authenticateToken as protect
 * Verifies JWT token and attaches user to req.user
 */
export const protect = authenticateToken;

/**
 * Re-export requireRole as authorize
 * Checks if user has required role(s)
 */
export const authorize = requireRole;

// Default export for convenience
export default {
  protect,
  authorize
};
