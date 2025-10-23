import express from 'express';
const router = express.Router();
import {
  getIntegrations,
  toggleIntegration,
  updateIntegrationConfig,
} from '../controllers/integrationController.js';
import { protect } from '../middleware/auth.js';
import { verifyRole } from '../middleware/rbac.js';

// All routes require authentication
router.use(protect);

// @route   GET /api/integrations
// @access  Private (all authenticated users can view)
router.get('/', getIntegrations);

// @route   POST /api/integrations/:id/toggle
// @access  Private (team_lead, manager, admin only)
router.post('/:id/toggle', verifyRole(['team_lead', 'manager', 'admin']), toggleIntegration);

// @route   PUT /api/integrations/:id/config
// @access  Private (team_lead, manager, admin only)
router.put('/:id/config', verifyRole(['team_lead', 'manager', 'admin']), updateIntegrationConfig);

export default router;
