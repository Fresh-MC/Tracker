/**
 * TeamDashboard.jsx - Dynamic Team Performance Dashboard with RBAC
 * 
 * Features:
 * - Multi-team support with dynamic filtering
 * - Real-time task completion tracking
 * - Role-based access control (Manager vs Team Lead/Employee)
 * - Backend integration with MongoDB
 * - Performance leaderboard
 * - Team member cards with hover details
 * 
 * RBAC Rules:
 * - Manager: See all teams, assign users, update all projects
 * - Team Lead/Employee: See own team only, update assigned tasks
 * 
 * Backend API Endpoints:
 * - GET /api/teams - Fetch teams based on user role
 * - GET /api/projects - Fetch projects
 * - GET /api/users - Fetch users
 * - GET /api/tasks - Fetch tasks for progress calculation
 * - POST /api/teams/:id/assign - Assign users to teams (managers only)
 * - PUT /api/tasks/:id - Update task status
 */

import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Code2, Shield, Users, Award, TrendingUp, Users2, FolderKanban } from "lucide-react";
import Input from "../components/Input.jsx";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SpeedDial from "../components/SpeedDial";
import { GridBackground } from "../components/lightswind/grid-dot-background";
import UserDetailsCard from "../components/UserDetailsCard.jsx";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ==================== HELPER FUNCTIONS ====================

/**
 * Get role-specific icon with color coding
 */
const getRoleIcon = (role) => {
  switch (role?.toLowerCase()) {
    case "developer":
    case "user":
      return <Code2 className="text-blue-400" />;
    case "manager":
    case "admin":
      return <Users className="text-green-400" />;
    case "team_lead":
      return <Award className="text-purple-400" />;
    case "security":
      return <Shield className="text-red-400" />;
    default:
      return <Users2 className="text-gray-400" />;
  }
};

/**
 * Get role display color for badges
 */
const getRoleColor = (role) => {
  switch (role?.toLowerCase()) {
    case "developer":
    case "user":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "manager":
    case "admin":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "team_lead":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "security":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

/**
 * Calculate user task completion statistics
 */
const calculateUserStats = (userId, tasks) => {
  const userTasks = tasks.filter(task => 
    task.assignedTo?._id === userId || task.assignedTo === userId
  );
  
  const completed = userTasks.filter(task => task.status === 'completed').length;
  const total = userTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

/**
 * Calculate team-wide statistics
 */
const calculateTeamStats = (teamMembers, tasks) => {
  const memberIds = teamMembers.map(m => m._id);
  const teamTasks = tasks.filter(task => 
    memberIds.includes(task.assignedTo?._id || task.assignedTo)
  );
  
  const completed = teamTasks.filter(task => task.status === 'completed').length;
  const total = teamTasks.length;
  const inProgress = teamTasks.filter(task => task.status === 'in-progress').length;
  
  return { completed, total, inProgress };
};

// ==================== MAIN COMPONENT ====================

export default function TeamDashboard() {
  // ========== AUTHENTICATION & AUTHORIZATION ==========
  
  const { user, apiUrl } = useAuth();
  
  /**
   * Role-based access control
   * Manager/Admin: Can see all teams and manage assignments
   * Team Lead/Employee: Can see only their own team
   */
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  
  // ========== REAL-TIME UPDATES ==========
  
  /**
   * Socket.IO connection for real-time task validation updates
   */
  const { socket, isConnected, taskUpdated, error: socketError } = useSocket();
  
  /**
   * Notification state for task completion alerts
   */
  const [notification, setNotification] = useState(null);
  
  // ========== STATE MANAGEMENT ==========
  
  /**
   * All teams fetched from backend (filtered by role)
   */
  const [teams, setTeams] = useState([]);
  
  /**
   * All users in the system
   */
  const [users, setUsers] = useState([]);
  
  /**
   * All tasks for progress calculation
   */
  const [tasks, setTasks] = useState([]);
  
  /**
   * All projects
   */
  const [projects, setProjects] = useState([]);
  
  /**
   * Selected team filter
   */
  const [selectedTeam, setSelectedTeam] = useState('all');
  
  /**
   * Search query for filtering users
   */
  const [search, setSearch] = useState("");
  
  /**
   * Currently hovered user for detail card
   */
  const [hoveredUser, setHoveredUser] = useState(null);
  
  /**
   * Loading states
   */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Team assignment modal state (for managers)
   */
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);

  // ========== REAL-TIME UPDATE HANDLER ==========
  
  /**
   * Handle real-time task updates from validation engine
   * Automatically refresh team statistics and user progress
   */
  useEffect(() => {
    if (taskUpdated && taskUpdated.module) {
      console.log('📨 Team Dashboard: Task update received:', taskUpdated);
      
      // Check if the completed task affects the current team view
      const moduleTeamId = taskUpdated.module.teamId;
      const currentUserTeamId = typeof user?.teamId === 'object' ? user?.teamId?._id : user?.teamId;
      
      // Show notification for managers or if task belongs to user's team
      if (isManager || moduleTeamId === currentUserTeamId) {
        setNotification({
          type: 'success',
          title: '🎉 Team Progress Update!',
          message: `${taskUpdated.module.assignedToName || 'Team member'} completed: ${taskUpdated.module.title}`,
          module: taskUpdated.module
        });
        
        // Refresh dashboard data to show updated statistics
        fetchDashboardData();
        
        // Auto-hide notification after 6 seconds
        setTimeout(() => {
          setNotification(null);
        }, 6000);
      }
    }
  }, [taskUpdated, user, isManager]);

  // ========== DATA FETCHING ==========
  
  /**
   * Fetch all necessary data on component mount
   */
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  /**
   * Debug: Log team selection changes
   */
  useEffect(() => {
    console.log('🎯 Selected Team:', selectedTeam);
    console.log('👥 Total Users:', users.length);
    console.log('📊 Teams Available:', teams.length);
    if (users.length > 0) {
      console.log('Sample User TeamId:', users[0]?.teamId);
    }
  }, [selectedTeam, users, teams]);

  /**
   * Main data fetching function
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const [teamsRes, usersRes, tasksRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/api/teams`, { headers }),
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/tasks`, { headers }),
        fetch(`${API_URL}/api/projects`, { headers }).catch(() => ({ ok: false }))
      ]);

      // Process teams
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
      } else {
        setTeams([]);
      }

      // Process users
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      } else {
        setUsers([]);
      }

      // Process tasks
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || []);
      } else {
        setTasks([]);
      }

      // Process projects (optional)
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : projectsData.projects || []);
      } else {
        setProjects([]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========== FILTERED DATA COMPUTATION ==========
  
  /**
   * Filter users based on role, team selection, and search query
   */
  const filteredUsers = users.filter(u => {
    // Extract teamId - handle both object and string cases
    const userTeamId = typeof u.teamId === 'object' ? u.teamId?._id : u.teamId;
    const currentUserTeamId = typeof user?.teamId === 'object' ? user?.teamId?._id : user?.teamId;
    
    // Debug logging (first user only to avoid spam)
    if (u === users[0] && selectedTeam !== 'all') {
      console.log('🔍 Filter Debug:', {
        username: u.username,
        userTeamId,
        selectedTeam,
        match: userTeamId === selectedTeam
      });
    }
    
    // RBAC: Non-managers can only see their own team
    if (!isManager && currentUserTeamId && userTeamId !== currentUserTeamId) {
      return false;
    }
    
    // Team filter
    if (selectedTeam !== 'all' && userTeamId !== selectedTeam) {
      return false;
    }
    
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      u.username?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.role?.toLowerCase().includes(searchLower);
    
    return matchesSearch;
  });

  /**
   * Compute user statistics with task data
   */
  const usersWithStats = filteredUsers.map(u => {
    const stats = calculateUserStats(u._id, tasks);
    return { ...u, ...stats };
  });

  /**
   * Generate leaderboard sorted by completion percentage
   */
  const leaderboard = [...usersWithStats]
    .sort((a, b) => {
      // First sort by percentage
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      // Then by total completed
      return b.completed - a.completed;
    })
    .slice(0, 5);

  /**
   * Calculate overall team statistics
   */
  const teamStats = calculateTeamStats(filteredUsers, tasks);

  // ========== TEAM ASSIGNMENT (MANAGERS ONLY) ==========
  
  /**
   * Assign user to a team
   */
  const handleAssignToTeam = async (userId, teamId) => {
    if (!isManager) {
      alert('⛔ Only managers can assign team members');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/teams/${teamId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        alert('✅ User assigned to team successfully!');
        fetchDashboardData(); // Refresh data
        setShowAssignModal(false);
        setSelectedUserForAssign(null);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to assign user'}`);
      }
    } catch (err) {
      console.error('Error assigning user:', err);
      alert('❌ Failed to assign user to team');
    }
  };

  /**
   * Update task status
   */
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
        alert('✅ Task status updated!');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to update task'}`);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert('❌ Failed to update task status');
    }
  };

  // ========== ANIMATION VARIANTS ==========
  
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  // ========== RENDER COMPONENT ==========

  return (
    <GridBackground
      gridSize={24}
      gridColor="#e4e4e7"
      darkGridColor="#262626"
      showFade={true}
      fadeIntensity={30}
      className="min-h-screen px-6 py-12"
    >
      {/* Socket.IO Connection Status */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#242424] border border-[#333] shadow-lg"
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-[#f8f7ec] text-sm">
          {isConnected ? '🔗 Live Updates' : '❌ Disconnected'}
        </span>
      </motion.div>

      {/* Real-time Task Completion Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-md"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="text-4xl animate-pulse">{notification.type === 'success' ? '🎉' : '⚠️'}</div>
                <div className="flex-1">
                  <h3 className="text-[#f8f7ec] font-bold text-lg mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-[#f8f7ec]/80 text-sm mb-3">
                    {notification.message}
                  </p>
                  {notification.module && (
                    <div className="mt-3 p-3 bg-black/40 rounded-lg space-y-1">
                      <p className="text-[#f8f7ec] text-sm">
                        <span className="font-semibold text-blue-400">Module:</span> {notification.module.title}
                      </p>
                      {notification.module.projectName && (
                        <p className="text-[#f8f7ec]/70 text-xs">
                          <span className="font-semibold">Project:</span> {notification.module.projectName}
                        </p>
                      )}
                      {notification.module.repository && (
                        <p className="text-[#f8f7ec]/70 text-xs">
                          <span className="font-semibold">Repo:</span> {notification.module.repository}
                        </p>
                      )}
                      {notification.module.commits && (
                        <p className="text-[#f8f7ec]/70 text-xs">
                          <span className="font-semibold">Commits:</span> {notification.module.commits}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="text-[#f8f7ec]/60 hover:text-[#f8f7ec] transition-colors text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4 p-4">
        {/* Sidebar SpeedDial */}
        <SpeedDial />

        {/* Main Content */}
        <div className="w-full">
          <Navbar />

          {/* Hero Header Section */}
          <div className="mt-6 bg-[#181818] rounded-3xl">
            <div className="min-h-screen w-full flex items-center justify-center px-4">
              <div className="w-full max-w-7xl mx-auto flex flex-col items-center space-y-8 py-12">
                
                {/* Page Header */}
                <div className="text-center mb-6">
                  <h1 className="text-5xl font-bold text-[#f8f7ec] mb-3">
                    Team Performance Dashboard
                  </h1>
                  <p className="text-[#f8f7ec]/70 text-lg">
                    {isManager ? 'Manage all teams and track performance' : 'View your team progress'}
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400">⚠️ {error}</p>
                    <button
                      onClick={fetchDashboardData}
                      className="mt-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-[#f8f7ec]/70">Loading dashboard data...</p>
                  </div>
                ) : (
                  <>
                    {/* Team Statistics Cards */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#242424] rounded-xl p-6 border border-[#333]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Users2 className="text-blue-400" size={24} />
                          <h3 className="text-[#f8f7ec]/70 text-sm">Total Members</h3>
                        </div>
                        <p className="text-3xl font-bold text-[#f8f7ec]">{filteredUsers.length}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#242424] rounded-xl p-6 border border-[#333]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <FolderKanban className="text-green-400" size={24} />
                          <h3 className="text-[#f8f7ec]/70 text-sm">Total Tasks</h3>
                        </div>
                        <p className="text-3xl font-bold text-[#f8f7ec]">{teamStats.total}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#242424] rounded-xl p-6 border border-[#333]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="text-purple-400" size={24} />
                          <h3 className="text-[#f8f7ec]/70 text-sm">Completed</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-400">{teamStats.completed}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#242424] rounded-xl p-6 border border-[#333]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="text-yellow-400" size={24} />
                          <h3 className="text-[#f8f7ec]/70 text-sm">Completion Rate</h3>
                        </div>
                        <p className="text-3xl font-bold text-yellow-400">
                          {teamStats.total > 0 ? Math.round((teamStats.completed / teamStats.total) * 100) : 0}%
                        </p>
                      </motion.div>
                    </div>

                    {/* Search Bar & Filters */}
                    <div className="mb-6 w-full flex items-center justify-between gap-4">
                      <Input
                        placeholder="Search by name, email, or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 text-[#181818] placeholder-gray-400 bg-[#f8f7ec] px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-48 text-[#181818] bg-[#f8f7ec] px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Teams</option>
                        {teams.map((team) => (
                          <option key={team._id} value={team._id}>
                            {team.name}
                          </option>
                        ))}
                      </select>

                      {isManager && (
                        <button
                          onClick={fetchDashboardData}
                          className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
                        >
                          🔄 Refresh
                        </button>
                      )}
                    </div>

                    {/* Leaderboard */}
                    <div className="mb-8 bg-[#242424] p-6 rounded-2xl shadow-xl w-full border border-[#333]">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="text-yellow-400" size={28} />
                        <h2 className="text-2xl text-[#f8f7ec] font-bold">🏆 Top Performers</h2>
                      </div>
                      
                      <div className="space-y-3">
                        {leaderboard.length > 0 ? (
                          leaderboard.map((user, i) => (
                            <motion.div
                              key={user._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#202020] transition-all"
                            >
                              <div className="flex items-center gap-4">
                                {/* Rank Badge */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                  i === 0 ? 'bg-yellow-500 text-white' :
                                  i === 1 ? 'bg-gray-300 text-gray-800' :
                                  i === 2 ? 'bg-orange-600 text-white' :
                                  'bg-[#333] text-[#f8f7ec]'
                                }`}>
                                  {i + 1}
                                </div>
                                
                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                  {getRoleIcon(user.role)}
                                  <div>
                                    <p className="text-[#f8f7ec] font-semibold">{user.username}</p>
                                    <p className="text-[#f8f7ec]/60 text-sm capitalize">{user.role}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Stats */}
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[#f8f7ec] font-semibold">
                                    {user.completed}/{user.total} tasks
                                  </p>
                                  <p className="text-[#f8f7ec]/60 text-sm">completed</p>
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                                  user.percentage >= 80 ? 'bg-green-500/20 text-green-400' :
                                  user.percentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {user.percentage}%
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-[#f8f7ec]/60">
                            <p>No performance data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Cards Section */}
                    <div className="w-full">
                      <h2 className="text-2xl text-[#f8f7ec] font-bold mb-4">
                        Team Members ({usersWithStats.length})
                      </h2>
                      
                      {usersWithStats.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {usersWithStats.map((user, i) => (
                            <motion.div
                              key={user._id}
                              custom={i}
                              initial="hidden"
                              animate="visible"
                              variants={cardVariants}
                              className="relative"
                              onMouseEnter={() => setHoveredUser(user)}
                              onMouseLeave={() => setHoveredUser(null)}
                            >
                              <div className="bg-[#242424] text-[#f8f7ec] hover:bg-[#2a2a2a] rounded-2xl shadow-lg p-6 flex flex-col items-center border border-[#333] hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
                                {/* User Avatar */}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-3">
                                  {user.username?.[0]?.toUpperCase() || '?'}
                                </div>

                                {/* User Name & Role */}
                                <div className="text-lg font-semibold flex items-center gap-2 mb-2">
                                  {getRoleIcon(user.role)}
                                  <span>{user.username}</span>
                                </div>
                                
                                {/* Role Badge */}
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border mb-4 capitalize ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>

                                {/* Progress Circle */}
                                <div className="w-28 h-28 mb-4">
                                  <CircularProgressbar
                                    value={user.percentage}
                                    text={`${user.percentage}%`}
                                    styles={buildStyles({
                                      pathColor: user.percentage >= 80 ? "#10b981" : 
                                                user.percentage >= 50 ? "#f59e0b" : "#ef4444",
                                      textColor: "#f8f7ec",
                                      trailColor: "#333",
                                      textSize: "20px"
                                    })}
                                  />
                                </div>

                                {/* Task Stats */}
                                <p className="text-[#f8f7ec]/80 mb-2 text-center">
                                  <span className="font-bold text-green-400">{user.completed}</span>
                                  <span className="text-[#f8f7ec]/60"> / </span>
                                  <span className="font-bold">{user.total}</span>
                                  <span className="text-[#f8f7ec]/60"> tasks completed</span>
                                </p>

                                {/* Email */}
                                <p className="text-[#f8f7ec]/50 text-xs truncate w-full text-center">
                                  {user.email}
                                </p>

                                {/* Manager Actions */}
                                {isManager && (
                                  <button
                                    onClick={() => {
                                      setSelectedUserForAssign(user);
                                      setShowAssignModal(true);
                                    }}
                                    className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm"
                                  >
                                    Manage Assignments
                                  </button>
                                )}
                              </div>

                              {/* Hover Detail Card */}
                              <AnimatePresence>
                                {hoveredUser?._id === user._id && (
                                  <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-full top-0 ml-4 z-50"
                                    style={{ pointerEvents: 'none' }}
                                  >
                                    <UserDetailsCard user={user} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-[#f8f7ec]/60">
                          <div className="text-6xl mb-4">👥</div>
                          <p className="text-xl">No team members found</p>
                          <p className="text-sm mt-2">Try adjusting your filters</p>
                        </div>
                      )}
                    </div>

                    {/* Team Assignment Modal (Managers Only) */}
                    {isManager && showAssignModal && selectedUserForAssign && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-[#333]"
                        >
                          <h3 className="text-2xl font-bold text-[#f8f7ec] mb-4">
                            Assign {selectedUserForAssign.username} to Team
                          </h3>
                          
                          <div className="space-y-4 mb-6">
                            {teams.map((team) => (
                              <button
                                key={team._id}
                                onClick={() => handleAssignToTeam(selectedUserForAssign._id, team._id)}
                                className="w-full p-4 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] text-[#f8f7ec] border border-[#333] hover:border-blue-500/30 transition-all text-left"
                              >
                                <p className="font-semibold">{team.name}</p>
                                <p className="text-sm text-[#f8f7ec]/60">
                                  {team.members?.length || 0} members
                                </p>
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setShowAssignModal(false);
                              setSelectedUserForAssign(null);
                            }}
                            className="w-full px-6 py-3 rounded-xl bg-[#242424] text-[#f8f7ec] hover:bg-[#333] transition-all"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      </div>
                    )}

                    {/* Final Divider */}
                    <div className="flex w-full items-center rounded-full my-6">
                      <div className="flex-1 border-b border-[#f8f7ec]/30"></div>
                      <span className="px-6 text-[#f8f7ec]/50 text-sm">End of Dashboard</span>
                      <div className="flex-1 border-b border-[#f8f7ec]/30"></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </GridBackground>
  );
}
