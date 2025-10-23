/**
 * Team Controller - Business logic for team management
 * 
 * Features:
 * - RBAC-based team access (managers see all, employees see own team)
 * - Team creation and management
 * - User assignment to teams
 * - Team statistics and member tracking
 */

import Team from '../models/Team.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

/**
 * @desc    Get all teams (filtered by user role)
 * @route   GET /api/teams
 * @access  Private (All authenticated users)
 */
export const getTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let teams;

    // Managers and admins can see all teams
    if (userRole === 'manager' || userRole === 'admin') {
      teams = await Team.find()
        .populate('members', 'username email role')
        .populate('projectId', 'name status')
        .sort({ createdAt: -1 });
    } else {
      // Team leads and employees only see their own team
      teams = await Team.find({ members: userId })
        .populate('members', 'username email role')
        .populate('projectId', 'name status')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
};

/**
 * @desc    Get single team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
export const getTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const team = await Team.findById(id)
      .populate('members', 'username email role')
      .populate('projectId', 'name status modules');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user has access to this team
    const isMember = team.members.some(member => member._id.toString() === userId.toString());
    const isManager = userRole === 'manager' || userRole === 'admin';

    if (!isMember && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team'
      });
    }

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team',
      error: error.message
    });
  }
};

/**
 * @desc    Create new team
 * @route   POST /api/teams
 * @access  Private (Managers and Admins only)
 */
export const createTeam = async (req, res) => {
  try {
    const { name, description, members, projectId } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team name already exists'
      });
    }

    // Validate members exist
    if (members && members.length > 0) {
      const userCount = await User.countDocuments({ _id: { $in: members } });
      if (userCount !== members.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more member IDs are invalid'
        });
      }
    }

    // Validate project exists if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    // Create team
    const team = await Team.create({
      name,
      description,
      members: members || [],
      projectId,
      createdBy: req.user._id
    });

    // Update users' teamId
    if (members && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { teamId: team._id }
      );
    }

    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'username email role')
      .populate('projectId', 'name status');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
      error: error.message
    });
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private (Managers and Admins only)
 */
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, projectId } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if new name conflicts with existing team
    if (name && name !== team.name) {
      const existingTeam = await Team.findOne({ name, _id: { $ne: id } });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'Team name already exists'
        });
      }
    }

    // Validate project if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    // Update team
    team.name = name || team.name;
    team.description = description !== undefined ? description : team.description;
    team.projectId = projectId !== undefined ? projectId : team.projectId;
    team.updatedAt = Date.now();

    await team.save();

    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'username email role')
      .populate('projectId', 'name status');

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team',
      error: error.message
    });
  }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private (Admins only)
 */
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Remove teamId from all members
    await User.updateMany(
      { teamId: id },
      { $unset: { teamId: 1 } }
    );

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team',
      error: error.message
    });
  }
};

/**
 * @desc    Assign user to team
 * @route   POST /api/teams/:id/assign
 * @access  Private (Managers and Admins only)
 */
export const assignUserToTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in team
    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }

    // Remove user from previous team if exists
    if (user.teamId) {
      await Team.findByIdAndUpdate(
        user.teamId,
        { $pull: { members: userId } }
      );
    }

    // Add user to new team
    team.members.push(userId);
    await team.save();

    // Update user's teamId
    user.teamId = id;
    await user.save();

    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'username email role')
      .populate('projectId', 'name status');

    res.status(200).json({
      success: true,
      message: 'User assigned to team successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Error assigning user to team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign user to team',
      error: error.message
    });
  }
};

/**
 * @desc    Remove user from team
 * @route   DELETE /api/teams/:id/remove/:userId
 * @access  Private (Managers and Admins only)
 */
export const removeUserFromTeam = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove user from team
    team.members = team.members.filter(memberId => memberId.toString() !== userId);
    await team.save();

    // Remove teamId from user
    user.teamId = undefined;
    await user.save();

    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'username email role')
      .populate('projectId', 'name status');

    res.status(200).json({
      success: true,
      message: 'User removed from team successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Error removing user from team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from team',
      error: error.message
    });
  }
};
