import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Get progress statistics for dashboard
// @route   GET /api/stats/progress
// @access  Private (all authenticated users)
const getProgressStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user's tasks
    const userTasks = await Task.find({ assignedTo: userId });
    const totalUserTasks = userTasks.length;
    const completedUserTasks = userTasks.filter((t) => t.status === 'completed').length;
    const inProgressUserTasks = userTasks.filter((t) => t.status === 'in-progress').length;

    // Calculate user progress percentage
    const progressYou = totalUserTasks > 0 ? Math.round((completedUserTasks / totalUserTasks) * 100) : 0;

    // Get team statistics (for team_lead, manager, admin)
    let progressTeam = 0;
    let teamStats = null;

    if (['team_lead', 'manager', 'admin'].includes(userRole)) {
      const allTasks = await Task.find();
      const totalTeamTasks = allTasks.length;
      const completedTeamTasks = allTasks.filter((t) => t.status === 'completed').length;
      progressTeam = totalTeamTasks > 0 ? Math.round((completedTeamTasks / totalTeamTasks) * 100) : 0;

      teamStats = {
        totalTasks: totalTeamTasks,
        completedTasks: completedTeamTasks,
        inProgressTasks: allTasks.filter((t) => t.status === 'in-progress').length,
        pendingTasks: allTasks.filter((t) => t.status === 'pending').length,
      };
    } else {
      // For regular users, show their own stats as "team" stats
      progressTeam = progressYou;
    }

    // Calculate expected progress based on time
    // This is a simple implementation - you can make it more sophisticated
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const totalDays = endOfMonth.getDate();
    const currentDay = now.getDate();
    const progressExpected = Math.round((currentDay / totalDays) * 100);

    res.status(200).json({
      success: true,
      data: {
        progressYou,
        progressTeam,
        progressExpected,
        userStats: {
          totalTasks: totalUserTasks,
          completedTasks: completedUserTasks,
          inProgressTasks: inProgressUserTasks,
          pendingTasks: userTasks.filter((t) => t.status === 'pending').length,
        },
        teamStats,
        isManager: ['team_lead', 'manager', 'admin'].includes(userRole),
      },
    });
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress statistics',
      error: error.message,
    });
  }
};

// @desc    Get task statistics by status
// @route   GET /api/stats/tasks
// @access  Private (team_lead, manager, admin only)
const getTaskStats = async (req, res) => {
  try {
    const tasks = await Task.find();

    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      byPriority: {
        high: tasks.filter((t) => t.priority === 'high').length,
        medium: tasks.filter((t) => t.priority === 'medium').length,
        low: tasks.filter((t) => t.priority === 'low').length,
      },
      overdue: tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task statistics',
      error: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/stats/users
// @access  Private (manager, admin only)
const getUserStats = async (req, res) => {
  try {
    const users = await User.find({ isActive: true });

    const stats = {
      total: users.length,
      byRole: {
        student: users.filter((u) => u.role === 'student').length,
        user: users.filter((u) => u.role === 'user').length,
        team_lead: users.filter((u) => u.role === 'team_lead').length,
        manager: users.filter((u) => u.role === 'manager').length,
        admin: users.filter((u) => u.role === 'admin').length,
      },
      active: users.filter((u) => u.isActive).length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
};

export { getProgressStats, getTaskStats, getUserStats };
