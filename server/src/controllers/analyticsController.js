/**
 * Analytics Controller - Advanced analytics and reporting for Stage 7
 * 
 * Features:
 * - Project analytics (module completion, timeline, trends)
 * - Team analytics (performance, leaderboard, velocity)
 * - User analytics (personal stats, productivity)
 * - Summary dashboard (KPIs, insights, alerts)
 * - MongoDB aggregation pipelines for efficient data processing
 * - RBAC enforcement (managers: all data, team leads: team only, users: personal only)
 */

import Project from '../models/Project.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * @desc    Get comprehensive project analytics
 * @route   GET /api/analytics/projects/:projectId
 * @access  Private (manager, team_lead with team access, or project members)
 */
export const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Get project with populated data
    const project = await Project.findById(projectId)
      .populate('teamId')
      .populate('modules.assignedToUserId', 'username email githubUsername avatar')
      .populate('modules.completedBy', 'username email githubUsername avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // RBAC: Check if user has access to this project
    const hasAccess = 
      userRole === 'manager' || 
      userRole === 'admin' ||
      (userRole === 'team_lead' && project.teamId && project.teamId._id.toString() === req.user.teamId?.toString()) ||
      project.modules.some(m => m.assignedToUserId?._id.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Calculate module statistics
    const totalModules = project.modules.length;
    const completedModules = project.modules.filter(m => m.status === 'completed').length;
    const inProgressModules = project.modules.filter(m => m.status === 'in-progress').length;
    const notStartedModules = project.modules.filter(m => m.status === 'not-started').length;
    const blockedModules = project.modules.filter(m => m.status === 'blocked').length;

    const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Calculate average completion time (in days)
    const completedWithTime = project.modules.filter(m => 
      m.status === 'completed' && m.completedAt && m.createdAt
    );
    
    let avgCompletionTime = 0;
    if (completedWithTime.length > 0) {
      const totalDays = completedWithTime.reduce((sum, m) => {
        const days = (new Date(m.completedAt) - new Date(m.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgCompletionTime = Math.round(totalDays / completedWithTime.length * 10) / 10;
    }

    // Module breakdown by status
    const modulesByStatus = {
      'not-started': notStartedModules,
      'in-progress': inProgressModules,
      'completed': completedModules,
      'blocked': blockedModules
    };

    // Module breakdown by assignee
    const modulesByAssignee = {};
    project.modules.forEach(module => {
      if (module.assignedToUserId) {
        const userId = module.assignedToUserId._id.toString();
        const username = module.assignedToUserId.username;
        
        if (!modulesByAssignee[userId]) {
          modulesByAssignee[userId] = {
            user: {
              _id: userId,
              username,
              email: module.assignedToUserId.email,
              avatar: module.assignedToUserId.avatar
            },
            total: 0,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            blocked: 0
          };
        }
        
        modulesByAssignee[userId].total++;
        modulesByAssignee[userId][module.status === 'not-started' ? 'notStarted' : 
                                    module.status === 'in-progress' ? 'inProgress' :
                                    module.status === 'completed' ? 'completed' : 'blocked']++;
      }
    });

    // Calculate timeline progress
    let timelineProgress = null;
    if (project.startDate && project.endDate) {
      const now = new Date();
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const totalDuration = end - start;
      const elapsed = now - start;
      const timeProgress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
      
      timelineProgress = {
        startDate: project.startDate,
        endDate: project.endDate,
        timeProgress,
        completionProgress: completionRate,
        onTrack: completionRate >= timeProgress - 10, // Within 10% tolerance
        daysRemaining: Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
      };
    }

    // Identify overdue modules (blocked or in-progress past expected completion)
    const overdueModules = project.modules
      .filter(m => m.status === 'blocked' || (m.status === 'in-progress' && m.createdAt))
      .map(m => ({
        id: m.id,
        title: m.title,
        status: m.status,
        assignedTo: m.assignedToUserId?.username || 'Unassigned',
        daysInProgress: Math.floor((Date.now() - new Date(m.createdAt)) / (1000 * 60 * 60 * 24))
      }))
      .filter(m => m.daysInProgress > 14) // Flag modules taking more than 14 days
      .sort((a, b) => b.daysInProgress - a.daysInProgress);

    // Module completion trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const completedOnDay = project.modules.filter(m => 
        m.completedAt && 
        new Date(m.completedAt) >= date && 
        new Date(m.completedAt) < nextDate
      ).length;
      
      completionTrend.push({
        date: date.toISOString().split('T')[0],
        completed: completedOnDay
      });
    }

    res.status(200).json({
      success: true,
      data: {
        project: {
          _id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          team: project.teamId?.name || null
        },
        overview: {
          totalModules,
          completedModules,
          inProgressModules,
          notStartedModules,
          blockedModules,
          completionRate,
          avgCompletionTime
        },
        modulesByStatus,
        modulesByAssignee: Object.values(modulesByAssignee),
        timelineProgress,
        overdueModules,
        completionTrend
      }
    });
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Get team analytics and performance metrics
 * @route   GET /api/analytics/teams/:teamId
 * @access  Private (manager, or team_lead of that team)
 */
export const getTeamAnalytics = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate team ID
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID'
      });
    }

    // Get team with members
    const team = await Team.findById(teamId)
      .populate('members', 'username email role githubUsername avatar githubStats')
      .populate('projectId', 'name status');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // RBAC: Check if user has access to this team
    const hasAccess = 
      userRole === 'manager' || 
      userRole === 'admin' ||
      (userRole === 'team_lead' && req.user.teamId?.toString() === teamId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this team'
      });
    }

    // Get all projects for this team
    const projects = await Project.find({ teamId });

    // Calculate team-wide statistics
    let totalModules = 0;
    let completedModules = 0;
    let inProgressModules = 0;
    let blockedModules = 0;

    const memberStats = {};

    projects.forEach(project => {
      project.modules.forEach(module => {
        totalModules++;
        
        if (module.status === 'completed') completedModules++;
        else if (module.status === 'in-progress') inProgressModules++;
        else if (module.status === 'blocked') blockedModules++;

        // Track per-member stats
        if (module.assignedToUserId) {
          const memberId = module.assignedToUserId.toString();
          
          if (!memberStats[memberId]) {
            memberStats[memberId] = {
              userId: memberId,
              total: 0,
              completed: 0,
              inProgress: 0,
              blocked: 0,
              avgCompletionTime: 0,
              completedModules: []
            };
          }
          
          memberStats[memberId].total++;
          
          if (module.status === 'completed') {
            memberStats[memberId].completed++;
            if (module.completedAt && module.createdAt) {
              memberStats[memberId].completedModules.push({
                completionTime: (new Date(module.completedAt) - new Date(module.createdAt)) / (1000 * 60 * 60 * 24)
              });
            }
          } else if (module.status === 'in-progress') {
            memberStats[memberId].inProgress++;
          } else if (module.status === 'blocked') {
            memberStats[memberId].blocked++;
          }
        }
      });
    });

    // Calculate average completion times for each member
    Object.values(memberStats).forEach(stats => {
      if (stats.completedModules.length > 0) {
        const totalTime = stats.completedModules.reduce((sum, m) => sum + m.completionTime, 0);
        stats.avgCompletionTime = Math.round(totalTime / stats.completedModules.length * 10) / 10;
      }
      delete stats.completedModules; // Remove raw data
    });

    // Create leaderboard (sorted by completion rate, then total completed)
    const leaderboard = team.members.map(member => {
      const stats = memberStats[member._id.toString()] || {
        userId: member._id.toString(),
        total: 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        avgCompletionTime: 0
      };

      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        user: {
          _id: member._id,
          username: member.username,
          email: member.email,
          role: member.role,
          avatar: member.avatar,
          githubStats: member.githubStats
        },
        tasksCompleted: stats.completed,
        tasksInProgress: stats.inProgress,
        tasksBlocked: stats.blocked,
        totalTasks: stats.total,
        completionRate,
        avgCompletionTime: stats.avgCompletionTime
      };
    }).sort((a, b) => {
      // Sort by completion rate first, then by total completed
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      return b.tasksCompleted - a.tasksCompleted;
    });

    // Calculate team velocity (modules completed per week) - last 4 weeks
    const velocity = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      let completedInWeek = 0;
      projects.forEach(project => {
        completedInWeek += project.modules.filter(m => 
          m.completedAt && 
          new Date(m.completedAt) >= weekStart && 
          new Date(m.completedAt) < weekEnd
        ).length;
      });
      
      velocity.push({
        week: `Week ${4 - i}`,
        weekStart: weekStart.toISOString().split('T')[0],
        completed: completedInWeek
      });
    }

    const avgVelocity = velocity.length > 0 
      ? Math.round(velocity.reduce((sum, v) => sum + v.completed, 0) / velocity.length * 10) / 10
      : 0;

    // Identify at-risk members (low completion rate or many blocked tasks)
    const atRiskMembers = leaderboard
      .filter(m => m.totalTasks > 0 && (m.completionRate < 50 || m.tasksBlocked > 2))
      .map(m => ({
        username: m.user.username,
        completionRate: m.completionRate,
        tasksBlocked: m.tasksBlocked,
        reason: m.tasksBlocked > 2 ? 'Multiple blocked tasks' : 'Low completion rate'
      }));

    res.status(200).json({
      success: true,
      data: {
        team: {
          _id: team._id,
          name: team.name,
          description: team.description,
          memberCount: team.members.length,
          project: team.projectId?.name || null
        },
        overview: {
          totalModules,
          completedModules,
          inProgressModules,
          blockedModules,
          completionRate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
          projectCount: projects.length
        },
        leaderboard,
        velocity,
        avgVelocity,
        atRiskMembers
      }
    });
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Get user analytics and personal stats
 * @route   GET /api/analytics/users/:userId
 * @access  Private (user themselves, their team_lead, or manager/admin)
 */
export const getUserAnalytics = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Get target user
    const targetUser = await User.findById(targetUserId).select('-password -githubToken');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // RBAC: Check if requesting user has access
    const hasAccess = 
      targetUserId === requestingUserId || // User viewing their own stats
      userRole === 'manager' || 
      userRole === 'admin' ||
      (userRole === 'team_lead' && targetUser.teamId?.toString() === req.user.teamId?.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to view this user\'s analytics'
      });
    }

    // Find all projects with modules assigned to this user
    const projects = await Project.find({
      'modules.assignedToUserId': targetUserId
    }).populate('teamId', 'name');

    // Calculate user statistics
    let totalModules = 0;
    let completedModules = 0;
    let inProgressModules = 0;
    let blockedModules = 0;
    const completionTimes = [];
    const projectBreakdown = [];

    projects.forEach(project => {
      const userModules = project.modules.filter(m => 
        m.assignedToUserId?.toString() === targetUserId
      );

      const projectCompleted = userModules.filter(m => m.status === 'completed').length;
      const projectInProgress = userModules.filter(m => m.status === 'in-progress').length;
      const projectBlocked = userModules.filter(m => m.status === 'blocked').length;

      totalModules += userModules.length;
      completedModules += projectCompleted;
      inProgressModules += projectInProgress;
      blockedModules += projectBlocked;

      // Track completion times
      userModules.forEach(m => {
        if (m.status === 'completed' && m.completedAt && m.createdAt) {
          const days = (new Date(m.completedAt) - new Date(m.createdAt)) / (1000 * 60 * 60 * 24);
          completionTimes.push(days);
        }
      });

      projectBreakdown.push({
        project: {
          _id: project._id,
          name: project.name,
          team: project.teamId?.name || null
        },
        total: userModules.length,
        completed: projectCompleted,
        inProgress: projectInProgress,
        blocked: projectBlocked,
        completionRate: userModules.length > 0 
          ? Math.round((projectCompleted / userModules.length) * 100) 
          : 0
      });
    });

    const avgCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length * 10) / 10
      : 0;

    const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Activity trend (last 30 days)
    const activityTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      let completedOnDay = 0;
      projects.forEach(project => {
        completedOnDay += project.modules.filter(m => 
          m.assignedToUserId?.toString() === targetUserId &&
          m.completedAt && 
          new Date(m.completedAt) >= date && 
          new Date(m.completedAt) < nextDate
        ).length;
      });
      
      activityTrend.push({
        date: date.toISOString().split('T')[0],
        completed: completedOnDay
      });
    }

    // Recent completions (last 10)
    const recentCompletions = [];
    projects.forEach(project => {
      project.modules
        .filter(m => 
          m.assignedToUserId?.toString() === targetUserId && 
          m.status === 'completed' && 
          m.completedAt
        )
        .forEach(m => {
          recentCompletions.push({
            module: {
              id: m.id,
              title: m.title
            },
            project: {
              _id: project._id,
              name: project.name
            },
            completedAt: m.completedAt,
            completionTime: m.createdAt 
              ? Math.round((new Date(m.completedAt) - new Date(m.createdAt)) / (1000 * 60 * 60 * 24) * 10) / 10
              : null
          });
        });
    });

    recentCompletions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const topRecentCompletions = recentCompletions.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
          avatar: targetUser.avatar,
          githubUsername: targetUser.githubUsername,
          githubStats: targetUser.githubStats
        },
        overview: {
          totalModules,
          completedModules,
          inProgressModules,
          blockedModules,
          completionRate,
          avgCompletionTime
        },
        projectBreakdown,
        activityTrend,
        recentCompletions: topRecentCompletions
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Get dashboard summary with KPIs and insights
 * @route   GET /api/analytics/summary
 * @access  Private (role-based data filtering)
 */
export const getSummaryAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userTeamId = req.user.teamId;

    // Get all projects based on role
    let projectQuery = {};
    
    if (userRole === 'user' || userRole === 'student') {
      // Users see only projects they're assigned to
      projectQuery = { 'modules.assignedToUserId': userId };
    } else if (userRole === 'team_lead') {
      // Team leads see their team's projects
      projectQuery = { teamId: userTeamId };
    }
    // Managers and admins see all projects (no filter)

    const projects = await Project.find(projectQuery)
      .populate('teamId', 'name')
      .populate('modules.assignedToUserId', 'username');

    // Calculate overall statistics
    let totalProjects = projects.length;
    let activeProjects = projects.filter(p => p.status === 'active').length;
    let completedProjects = projects.filter(p => p.status === 'completed').length;

    let totalModules = 0;
    let completedModules = 0;
    let inProgressModules = 0;
    let blockedModules = 0;

    const userContributions = {};

    projects.forEach(project => {
      project.modules.forEach(module => {
        // For regular users, only count their own modules
        if ((userRole === 'user' || userRole === 'student') && 
            module.assignedToUserId?._id.toString() !== userId) {
          return;
        }

        totalModules++;
        
        if (module.status === 'completed') completedModules++;
        else if (module.status === 'in-progress') inProgressModules++;
        else if (module.status === 'blocked') blockedModules++;

        // Track user contributions (for managers/team leads)
        if (userRole !== 'user' && userRole !== 'student' && module.assignedToUserId) {
          const assignedUserId = module.assignedToUserId._id.toString();
          const assignedUsername = module.assignedToUserId.username;

          if (!userContributions[assignedUserId]) {
            userContributions[assignedUserId] = {
              username: assignedUsername,
              completed: 0,
              total: 0
            };
          }

          userContributions[assignedUserId].total++;
          if (module.status === 'completed') {
            userContributions[assignedUserId].completed++;
          }
        }
      });
    });

    const overallCompletionRate = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100) 
      : 0;

    // Top performers (only for managers/team leads)
    let topPerformers = [];
    if (userRole !== 'user' && userRole !== 'student') {
      topPerformers = Object.values(userContributions)
        .map(u => ({
          username: u.username,
          completed: u.completed,
          total: u.total,
          completionRate: u.total > 0 ? Math.round((u.completed / u.total) * 100) : 0
        }))
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 5);
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let recentCompletions = 0;
    projects.forEach(project => {
      project.modules.forEach(module => {
        if ((userRole === 'user' || userRole === 'student') && 
            module.assignedToUserId?._id.toString() !== userId) {
          return;
        }

        if (module.completedAt && new Date(module.completedAt) >= sevenDaysAgo) {
          recentCompletions++;
        }
      });
    });

    // Alerts and insights
    const alerts = [];

    // Alert: Blocked modules
    if (blockedModules > 0) {
      alerts.push({
        type: 'warning',
        message: `${blockedModules} module${blockedModules > 1 ? 's are' : ' is'} currently blocked`,
        priority: 'high'
      });
    }

    // Alert: Low completion rate
    if (overallCompletionRate < 30 && totalModules > 0) {
      alerts.push({
        type: 'warning',
        message: 'Overall completion rate is below 30%',
        priority: 'medium'
      });
    }

    // Alert: No recent activity
    if (recentCompletions === 0 && totalModules > completedModules) {
      alerts.push({
        type: 'info',
        message: 'No modules completed in the last 7 days',
        priority: 'low'
      });
    }

    // Insight: Good progress
    if (overallCompletionRate >= 70) {
      alerts.push({
        type: 'success',
        message: 'Great progress! Over 70% completion rate',
        priority: 'low'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalModules,
          completedModules,
          inProgressModules,
          blockedModules,
          overallCompletionRate
        },
        recentActivity: {
          last7Days: recentCompletions
        },
        topPerformers,
        alerts,
        userRole,
        accessLevel: userRole === 'manager' || userRole === 'admin' ? 'full' :
                     userRole === 'team_lead' ? 'team' : 'personal'
      }
    });
  } catch (error) {
    console.error('Error fetching summary analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary analytics',
      error: error.message
    });
  }
};

export default {
  getProjectAnalytics,
  getTeamAnalytics,
  getUserAnalytics,
  getSummaryAnalytics
};
