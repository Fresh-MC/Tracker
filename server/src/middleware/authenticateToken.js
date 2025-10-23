/**
 * authenticateToken.js - JWT Authentication & Role-Based Authorization Middleware
 * 
 * This file provides comprehensive authentication and authorization middleware
 * for protecting routes and implementing role-based access control (RBAC).
 * 
 * Middleware Functions:
 * 
 * 1. authenticateToken(req, res, next)
 *    - Verifies JWT token from Authorization header or cookies
 *    - Attaches user object to req.user with { id, role, username, email }
 *    - Returns 401 if token is missing, invalid, or expired
 *    - Checks if user exists in database and is active
 * 
 * 2. requireRole(...roles)
 *    - Returns middleware that checks if user has required role
 *    - Must be used AFTER authenticateToken middleware
 *    - Accepts multiple roles as arguments: requireRole('admin', 'manager')
 *    - Returns 403 if user doesn't have required permissions
 * 
 * Usage Examples:
 * 
 * Basic authentication (all logged-in users):
 * router.get('/profile', authenticateToken, getProfile);
 * 
 * Role-based access (specific roles only):
 * router.delete('/users/:id', authenticateToken, requireRole('admin'), deleteUser);
 * router.get('/team', authenticateToken, requireRole('manager', 'admin'), getTeam);
 * 
 * Token Sources (checked in order):
 * 1. Authorization header: "Bearer <token>"
 * 2. HTTP-only cookie: "token"
 * 
 * Security Features:
 * - JWT signature verification
 * - Token expiration check
 * - User existence validation
 * - Active account verification
 * - Role-based access control
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authenticate JWT Token Middleware
 * 
 * Reads token from Authorization header or cookies,
 * verifies it, and attaches user to request object.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies (httpOnly cookie)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
        error: 'NO_TOKEN'
      });
    }

    try {
      // Verify token signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database (exclude password field)
      const user = await User.findById(decoded.id).select('-password');

      // User not found in database
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
          error: 'USER_NOT_FOUND'
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated. Please contact support.',
          error: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Attach user to request object for use in next middleware/controller
      req.user = user;

      next();
    } catch (error) {
      // Token verification failed (invalid signature, expired, malformed)
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
        error: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    // Unexpected server error
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Require Specific Role(s) Middleware
 * 
 * Checks if authenticated user has one of the required roles.
 * MUST be used after authenticateToken middleware.
 * 
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'manager', 'user')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Single role
 * router.delete('/users/:id', authenticateToken, requireRole('admin'), deleteUser);
 * 
 * // Multiple roles (user must have at least one)
 * router.get('/team', authenticateToken, requireRole('manager', 'admin'), getTeam);
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check if user is attached to request (authenticateToken should run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please use authenticateToken middleware first.',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. User role '${req.user.role}' is not authorized to access this route.`,
        requiredRoles: roles,
        currentRole: req.user.role,
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // User has required role - proceed to next middleware
    next();
  };
};

/**
 * Alias for authenticateToken (backward compatibility)
 * Some developers prefer "protect" naming convention
 */
export const protect = authenticateToken;

/**
 * Alias for requireRole (backward compatibility)
 * Some developers prefer "authorize" naming convention
 */
export const authorize = requireRole;

// Default export for convenience
export default {
  authenticateToken,
  requireRole,
  protect,
  authorize
};
