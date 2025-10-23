/**
 * Analytics Routes - Stage 7 advanced analytics and reporting
 * 
 * Endpoints:
 * - GET /api/analytics/summary - Dashboard summary (all roles with RBAC filtering)
 * - GET /api/analytics/projects/:projectId - Project-specific analytics
 * - GET /api/analytics/teams/:teamId - Team performance analytics
 * - GET /api/analytics/users/:userId - User-specific analytics
 * 
 * RBAC:
 * - All endpoints require authentication
 * - Data access filtered by role in controller logic
 * - Managers: Full access to all data
 * - Team Leads: Team-specific data only
 * - Users: Personal data only
 */

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
router.use(protect);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get dashboard summary with KPIs, insights, and alerts
 * @access  Private (all authenticated users, data filtered by role)
 */
router.get('/summary', getSummaryAnalytics);

/**
 * @route   GET /api/analytics/projects/:projectId
 * @desc    Get comprehensive project analytics
 * @access  Private (project members, team leads of project team, managers)
 */
router.get('/projects/:projectId', getProjectAnalytics);

/**
 * @route   GET /api/analytics/teams/:teamId
 * @desc    Get team performance analytics and leaderboard
 * @access  Private (team lead of that team, managers)
 */
router.get('/teams/:teamId', getTeamAnalytics);

/**
 * @route   GET /api/analytics/users/:userId
 * @desc    Get user-specific analytics and personal stats
 * @access  Private (user themselves, their team lead, managers)
 */
router.get('/users/:userId', getUserAnalytics);

export default router;
