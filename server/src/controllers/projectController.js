/**
 * Project Controller - Business logic for project management
 * 
 * Features:
 * - RBAC-based project access
 * - Project CRUD operations
 * - Module management
 * - Status tracking
 */

import Project from '../models/Project.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

/**
 * @desc    Get all projects (filtered by user role)
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let projects;

    // Managers and admins can see all projects
    if (userRole === 'manager' || userRole === 'admin') {
      projects = await Project.find()
        .populate('teamId', 'name members')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });
    } else {
      // Team members only see projects assigned to their team
      const user = await User.findById(userId);
      if (user.teamId) {
        projects = await Project.find({ teamId: user.teamId })
          .populate('teamId', 'name members')
          .populate('createdBy', 'username email')
          .sort({ createdAt: -1 });
      } else {
        projects = [];
      }
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const project = await Project.findById(id)
      .populate('teamId', 'name members')
      .populate('createdBy', 'username email')
      .populate('modules.assignedToUserId', 'username email role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access permissions
    const isManager = userRole === 'manager' || userRole === 'admin';
    const user = await User.findById(userId);
    const isTeamMember = project.teamId && user.teamId && 
                         project.teamId._id.toString() === user.teamId.toString();

    if (!isManager && !isTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Managers and Admins only)
 */
export const createProject = async (req, res) => {
  try {
    const { name, description, modules, teamId, startDate, endDate } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    // Validate team exists if provided
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(400).json({
          success: false,
          message: 'Team not found'
        });
      }
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      modules: modules || [],
      teamId,
      startDate,
      endDate,
      createdBy: req.user._id,
      status: 'planning'
    });

    // Update team's projectId if team is assigned
    if (teamId) {
      await Team.findByIdAndUpdate(teamId, { projectId: project._id });
    }

    // Populate project data
    const populatedProject = await Project.findById(project._id)
      .populate('teamId', 'name members')
      .populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Managers and Admins only)
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, teamId, startDate, endDate } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Validate team if provided
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(400).json({
          success: false,
          message: 'Team not found'
        });
      }
    }

    // Update project
    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.status = status || project.status;
    project.teamId = teamId !== undefined ? teamId : project.teamId;
    project.startDate = startDate !== undefined ? startDate : project.startDate;
    project.endDate = endDate !== undefined ? endDate : project.endDate;
    project.updatedAt = Date.now();

    await project.save();

    // Update team's projectId if team is assigned
    if (teamId) {
      await Team.findByIdAndUpdate(teamId, { projectId: project._id });
    }

    // Populate project data
    const populatedProject = await Project.findById(project._id)
      .populate('teamId', 'name members')
      .populate('createdBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Admins only)
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Remove projectId from associated team
    if (project.teamId) {
      await Team.findByIdAndUpdate(
        project.teamId,
        { $unset: { projectId: 1 } }
      );
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

/**
 * @desc    Update module status
 * @route   PUT /api/projects/:id/modules/:moduleId
 * @access  Private (Users assigned to module or managers)
 */
export const updateModuleStatus = async (req, res) => {
  try {
    const { id, moduleId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate status
    const validStatuses = ['not-started', 'in-progress', 'completed', 'blocked'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (not-started, in-progress, completed, blocked)'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find the module
    const module = project.modules.find(m => m.id === parseInt(moduleId));
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check permissions
    const isManager = userRole === 'manager' || userRole === 'admin';
    const isAssigned = module.assignedToUserId && 
                       module.assignedToUserId.toString() === userId.toString();

    if (!isManager && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this module'
      });
    }

    // Update module status
    module.status = status;
    project.updatedAt = Date.now();

    await project.save();

    // Populate project data
    const populatedProject = await Project.findById(project._id)
      .populate('teamId', 'name members')
      .populate('modules.assignedToUserId', 'username email role');

    res.status(200).json({
      success: true,
      message: 'Module status updated successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error updating module status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module status',
      error: error.message
    });
  }
};
