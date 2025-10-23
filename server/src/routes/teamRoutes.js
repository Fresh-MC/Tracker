/**
 * Team Routes - API endpoints for team management
 * 
 * Endpoints:
 * - GET /api/teams - Fetch all teams (filtered by user role)
 * - GET /api/teams/:id - Fetch specific team
 * - POST /api/teams - Create new team (managers only)
 * - PUT /api/teams/:id - Update team (managers only)
 * - DELETE /api/teams/:id - Delete team (admins only)
 * - POST /api/teams/:id/assign - Assign user to team (managers only)
 * - DELETE /api/teams/:id/remove/:userId - Remove user from team (managers only)
 */

import express from 'express';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  assignUserToTeam,
  removeUserFromTeam
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Team CRUD operations
router.route('/')
  .get(getTeams) // All authenticated users can view teams (filtered by role)
  .post(authorize('manager', 'admin'), createTeam); // Managers can create teams

router.route('/:id')
  .get(getTeam)
  .put(authorize('manager', 'admin'), updateTeam)
  .delete(authorize('admin'), deleteTeam);

// Team assignment operations
router.post('/:id/assign', authorize('manager', 'admin'), assignUserToTeam);
router.delete('/:id/remove/:userId', authorize('manager', 'admin'), removeUserFromTeam);

export default router;
