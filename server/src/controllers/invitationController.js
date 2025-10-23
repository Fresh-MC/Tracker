import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Get all invitations
// @route   GET /api/invitations
// @access  Private (team_lead, manager, admin only)
const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate('invitedBy', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message,
    });
  }
};

// @desc    Get invitations sent by current user
// @route   GET /api/invitations/my-invitations
// @access  Private (team_lead, manager, admin only)
const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await Invitation.find({ invitedBy: userId })
      .populate('invitedBy', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching my invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your invitations',
      error: error.message,
    });
  }
};

// @desc    Create new invitation
// @route   POST /api/invitations
// @access  Private (team_lead, manager, admin only)
const createInvitation = async (req, res) => {
  try {
    const { email, role } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Check if pending invitation already exists
    const existingInvitation = await Invitation.findOne({
      email,
      status: 'pending',
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Pending invitation already exists for this email',
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation with 7 days expiry
    const invitation = await Invitation.create({
      email,
      role,
      invitedBy: userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Populate invitedBy before sending response
    await invitation.populate('invitedBy', 'username email role');

    // TODO: Send invitation email with token (implement in Stage 5)
    // await sendInvitationEmail(email, token);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invitation',
      error: error.message,
    });
  }
};

// @desc    Resend invitation
// @route   POST /api/invitations/:id/resend
// @access  Private (team_lead, manager, admin only)
const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only resend pending invitations',
      });
    }

    // Generate new token and extend expiry
    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    // TODO: Send invitation email with new token
    // await sendInvitationEmail(invitation.email, invitation.token);

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: invitation,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message,
    });
  }
};

// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private (team_lead, manager, admin only)
const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    // Only creator or admin/manager can cancel
    if (
      invitation.invitedBy.toString() !== userId &&
      !['admin', 'manager'].includes(userRole)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this invitation',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending invitations',
      });
    }

    invitation.status = 'expired';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      data: invitation,
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message,
    });
  }
};

export {
  getInvitations,
  getMyInvitations,
  createInvitation,
  resendInvitation,
  cancelInvitation,
};
