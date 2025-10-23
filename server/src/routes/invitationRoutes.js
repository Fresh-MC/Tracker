import express from 'express';
const router = express.Router();
import {
  getInvitations,
  getMyInvitations,
  createInvitation,
  resendInvitation,
  cancelInvitation,
} from '../controllers/invitationController.js';
import { protect } from '../middleware/auth.js';
import { verifyRole } from '../middleware/rbac.js';

// All routes require authentication and specific roles
router.use(protect);
router.use(verifyRole(['team_lead', 'manager', 'admin']));

// @route   GET /api/invitations
// @access  Private (team_lead, manager, admin only)
router.get('/', getInvitations);

// @route   GET /api/invitations/my-invitations
// @access  Private (team_lead, manager, admin only)
router.get('/my-invitations', getMyInvitations);

// @route   POST /api/invitations
// @access  Private (team_lead, manager, admin only)
router.post('/', createInvitation);

// @route   POST /api/invitations/:id/resend
// @access  Private (team_lead, manager, admin only)
router.post('/:id/resend', resendInvitation);

// @route   DELETE /api/invitations/:id
// @access  Private (team_lead, manager, admin only)
router.delete('/:id', cancelInvitation);

export default router;
