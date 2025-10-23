import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  assignTask
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';
import { verifyRole } from '../middleware/rbac.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// RBAC-protected route: Assign task (team_lead, manager, admin only)
router.post('/assignTask', verifyRole(['team_lead', 'manager', 'admin']), assignTask);

router.route('/')
  .get(getTasks)
  .post(authorize('manager', 'admin'), createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(authorize('manager', 'admin'), deleteTask);

router.post('/:id/comments', addComment);

export default router;
