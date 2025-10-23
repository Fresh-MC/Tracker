/**
 * Project Routes - API endpoints for project management
 * 
 * Endpoints:
 * - GET /api/projects - Fetch all projects
 * - GET /api/projects/:id - Fetch specific project
 * - POST /api/projects - Create new project
 * - PUT /api/projects/:id - Update project
 * - DELETE /api/projects/:id - Delete project
 * - PUT /api/projects/:id/modules/:moduleId - Update module status
 */

import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateModuleStatus
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Project CRUD operations
router.route('/')
  .get(getProjects)
  .post(authorize('manager', 'admin'), createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('manager', 'admin'), updateProject)
  .delete(authorize('admin'), deleteProject);

// Module status update
router.put('/:id/modules/:moduleId', updateModuleStatus);

export default router;
