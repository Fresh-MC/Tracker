import express from 'express';
const router = express.Router();
import {
  getProgressStats,
  getTaskStats,
  getUserStats,
} from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';
import { verifyRole } from '../middleware/rbac.js';

// All routes require authentication
router.use(protect);

// @route   GET /api/stats/progress
// @access  Private (all authenticated users)
router.get('/progress', getProgressStats);

// @route   GET /api/stats/tasks
// @access  Private (team_lead, manager, admin only)
router.get('/tasks', verifyRole(['team_lead', 'manager', 'admin']), getTaskStats);

// @route   GET /api/stats/users
// @access  Private (manager, admin only)
router.get('/users', verifyRole(['manager', 'admin']), getUserStats);

export default router;
