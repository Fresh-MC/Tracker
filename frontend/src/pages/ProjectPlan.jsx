/**
 * ProjectPlan.jsx - Stage 3: Fully Dynamic, Backend-Driven, Role-Based Project Management
 * 
 * Features:
 * - Three-tab interface: Project Tasks, Invite Members, Link Integrations
 * - Complete MongoDB integration for tasks, users, and integrations
 * - Role-based access control (team_lead, manager, admin can manage; employees view only)
 * - Dynamic data fetching with loading states and error handling
 * - Maintains all existing UI/UX, animations, and Tailwind styling
 * 
 * Tab Structure:
 * 1. Project Tasks: Create and view tasks (role-based form visibility)
 * 2. Invite Members: Send invitations and view team members (managers only)
 * 3. Link Integrations: Connect external tools like GitHub, Figma, Jira
 * 
 * Backend API Endpoints:
 * - GET/POST /api/tasks - Fetch and create tasks
 * - GET /api/users - Fetch team members
 * - POST /api/users/invite - Send member invitations (planned)
 * - GET/PUT /api/projects/:projectId/integrations - Manage integrations (planned)
 * 
 * Environment Variables:
 * - VITE_API_URL: Backend API base URL
 */

import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { GridBackground } from '../components/lightswind/grid-dot-background';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import UploadProofSection from '../components/UploadProofSection';
import UserDetailsCard from '../components/UserDetailsCard';
import ProgressBarGraph from '../components/ProgressBarGraph';
import Planning from '../components/Planning';
import TaskDependencySelect from '../components/TaskDependencySelect';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ==================== DATA STRUCTURES ====================

/**
 * Task Dependency Management
 * Local state for planning dependencies (integrates with Planning component)
 */
const initialDependencyTasks = [
  { id: 1, title: "Design UI", dependsOn: null },
  { id: 2, title: "Build Backend", dependsOn: null },
  { id: 3, title: "Integrate API", dependsOn: null },
];

/**
 * Project Statistics for Overview Section
 * These will eventually be calculated from backend data
 */
const planStats = [
  // 📈 Progress Overview
  { category: "Progress", label: "Total Tasks", value: "100" },
  { category: "Progress", label: "Planned Tasks", value: "12" },
  { category: "Progress", label: "Tasks in Progress", value: "5" },
  { category: "Progress", label: "Completed Tasks", value: "9" },
  { category: "Progress", label: "Delayed Tasks", value: "3", color: "text-red-400" },

  // ⏱ Efficiency
  { category: "Efficiency", label: "Avg Completion Time", value: "1.8 days" },
  { category: "Efficiency", label: "On-time Delivery Rate", value: "75%", color: "text-green-400" },

  // ⚠️ Insights
  { category: "Insights", label: "Top Blocker", value: "Review Wait" },
  { category: "Insights", label: "Next Sprint Goal", value: "Complete SH19 Tracker" },

  // 👥 Team & Scores
  { category: "Team", label: "Team Performance", value: "8.4/10", color: "text-blue-500" },
  { category: "Team", label: "Team GPA", value: "7.9", color: "text-green-500" },
  { category: "Team", label: "GPA", value: "8.4", color: "text-yellow-400" },
];

/**
 * Mock Reviews Data
 * TODO: Fetch from backend when review system is implemented
 */
const reviews = [
  { from: 'Manager', text: 'Efficient this week.', sentiment: 'positive' },
  { from: 'Peer', text: 'Helpful but needs quicker reviews.', sentiment: 'neutral' },
];

// ==================== ANIMATION VARIANTS ====================

/**
 * Card animation configuration for staggered entry effect
 */
const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

// ==================== MAIN COMPONENT ====================

const ProjectPlan = () => {
  // ========== AUTHENTICATION & AUTHORIZATION ==========
  
  const { user, apiUrl } = useAuth();
  
  /**
   * Role-based access control
   * Only team_lead, manager, and admin can create tasks and invite members
   */
  const canManage = user?.role === 'team_lead' || user?.role === 'manager' || user?.role === 'admin';

  // ========== TAB MANAGEMENT ==========
  
  /**
   * Active tab state: 'tasks' | 'invite' | 'integrations'
   * Controls which section of the interface is displayed
   */
  const [activeTab, setActiveTab] = useState('tasks');

  // ========== TASK MANAGEMENT STATE ==========
  
  /**
   * Form data for creating new tasks
   */
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium'
  });

  /**
   * Tasks fetched from MongoDB
   * Filtered based on user role (employees see only their tasks)
   */
  const [projectTasks, setProjectTasks] = useState([]);

  /**
   * All users for the assignment dropdown
   */
  const [users, setUsers] = useState([]);

  /**
   * Loading state for task operations
   */
  const [loadingTasks, setLoadingTasks] = useState(false);

  /**
   * Error state for task operations
   */
  const [taskError, setTaskError] = useState(null);

  // ========== MEMBER INVITATION STATE ==========
  
  /**
   * Form data for inviting new members
   */
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'user'
  });

  /**
   * Existing project members fetched from MongoDB
   */
  const [projectMembers, setProjectMembers] = useState([]);

  /**
   * Loading state for member operations
   */
  const [loadingMembers, setLoadingMembers] = useState(false);

  /**
   * Error state for member operations
   */
  const [memberError, setMemberError] = useState(null);

  /**
   * Pending invitations fetched from MongoDB
   */
  const [pendingInvitations, setPendingInvitations] = useState([]);

  /**
   * Loading state for invitations
   */
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // ========== INTEGRATIONS STATE ==========
  
  /**
   * Available integrations (GitHub, Figma, Jira, etc.)
   * TODO: Replace with actual backend API when available
   */
  const [integrations, setIntegrations] = useState([]);

  /**
   * Loading state for integration operations
   */
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  /**
   * Error state for integration operations
   */
  const [integrationError, setIntegrationError] = useState(null);

  // ========== DEPENDENCY MANAGEMENT STATE ==========
  
  /**
   * Local task dependencies for the Planning section
   * Separate from main projectTasks to avoid conflicts
   */
  const [dependencyTasks, setDependencyTasks] = useState(initialDependencyTasks);

  // ========== CREATE PROJECT MODAL STATE ==========
  
  /**
   * Controls visibility of Create Project Modal
   */
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ========== DATA FETCHING EFFECTS ==========
  
  /**
   * Fetch users on component mount for assignment dropdown
   * This data is needed across multiple tabs
   */
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetch data when tab changes
   * Optimizes by only loading data for the active tab
   */
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchProjectTasks();
    } else if (activeTab === 'invite') {
      fetchProjectMembers();
      if (canManage) {
        fetchPendingInvitations();
      }
    } else if (activeTab === 'integrations') {
      fetchIntegrations();
    }
  }, [activeTab]);

  // ========== API FUNCTIONS ==========
  
  /**
   * Fetch all users for task assignment dropdown
   * Requires manager/admin role on backend
   */
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        console.error('Failed to fetch users:', response.statusText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  /**
   * Fetch project tasks from MongoDB
   * Backend automatically filters based on user role:
   * - team_lead/manager/admin: See all tasks
   * - employee: See only assigned tasks
   */
  const fetchProjectTasks = async () => {
    setLoadingTasks(true);
    setTaskError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjectTasks(data.tasks || []);
      } else {
        const errorData = await response.json();
        setTaskError(errorData.message || 'Failed to load tasks');
        setProjectTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTaskError('Network error. Please check your connection.');
      setProjectTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  /**
   * Fetch all project members
   * Shows all users in the system (filtered by backend)
   */
  const fetchProjectMembers = async () => {
    setLoadingMembers(true);
    setMemberError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjectMembers(Array.isArray(data) ? data : data.users || []);
      } else {
        const errorData = await response.json();
        setMemberError(errorData.message || 'Failed to load members');
        setProjectMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMemberError('Network error. Please check your connection.');
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  /**
   * Fetch pending invitations
   * Only accessible to team_lead, manager, and admin
   */
  const fetchPendingInvitations = async () => {
    setLoadingInvitations(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(data.data || []);
      } else {
        console.error('Failed to fetch invitations');
        setPendingInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setPendingInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  };

  /**
   * Cancel an invitation
   */
  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Invitation cancelled successfully');
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to cancel invitation'}`);
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('❌ Failed to cancel invitation');
    }
  };

  /**
   * Resend an invitation
   */
  const handleResendInvitation = async (invitationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Invitation resent successfully');
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to resend invitation'}`);
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('❌ Failed to resend invitation');
    }
  };

  /**
   * Fetch available integrations and their connection status
   * TODO: Replace with actual backend endpoint when implemented
   * Current: Mock data for demonstration
   */
  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    setIntegrationError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/integrations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map backend data to frontend format
        const formattedIntegrations = data.data.map(integration => ({
          _id: integration._id,
          service: integration.name,
          connected: integration.connected,
          icon: getIntegrationIcon(integration.icon),
          connectedBy: integration.connectedBy,
          connectedAt: integration.connectedAt
        }));
        setIntegrations(formattedIntegrations);
      } else {
        console.error('Failed to fetch integrations');
        setIntegrationError('Failed to load integrations');
        setIntegrations([]);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setIntegrationError('Failed to load integrations');
      setIntegrations([]);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  /**
   * Map icon names from backend to emoji icons
   */
  const getIntegrationIcon = (iconName) => {
    const iconMap = {
      'FaGithub': '🐙',
      'FaFigma': '🎨',
      'SiJira': '📊',
      'FaSlack': '💬',
      'FaTrello': '📋',
      'SiLinear': '⚡'
    };
    return iconMap[iconName] || '🔗';
  };

  // ========== FORM HANDLERS ==========
  
  /**
   * Handle task creation form submission
   * Only team_lead, manager, and admin can create tasks
   */
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!canManage) {
      alert('⛔ Only team leads and managers can create tasks');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskFormData.title,
          description: taskFormData.description,
          assignedTo: taskFormData.assignedTo,
          dueDate: taskFormData.deadline,
          status: 'pending',
          priority: taskFormData.priority
        })
      });

      if (response.ok) {
        alert('✅ Task created successfully!');
        // Reset form
        setTaskFormData({ 
          title: '', 
          description: '', 
          assignedTo: '', 
          deadline: '',
          priority: 'medium'
        });
        // Refresh task list
        fetchProjectTasks();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to create task'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('❌ Network error. Failed to create task.');
    }
  };

  /**
   * Handle member invitation form submission
   * Only team_lead, manager, and admin can invite members
   */
  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    if (!canManage) {
      alert('⛔ Only team leads and managers can invite members');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteFormData.email,
          role: inviteFormData.role
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        
        // Reset form
        setInviteFormData({ email: '', role: 'user' });
        
        // Refresh members and invitations list
        fetchProjectMembers();
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to send invitation'}`);
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('❌ Failed to send invitation');
    }
  };

  /**
   * Toggle integration connection status
   * Only team_lead, manager, and admin can manage integrations
   * TODO: Implement actual backend endpoint for integration management
   */
  const handleToggleIntegration = async (integrationId, currentStatus) => {
    if (!canManage) {
      alert('⛔ Only team leads and managers can manage integrations');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/integrations/${integrationId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state with the response
        setIntegrations(prev => 
          prev.map(int => 
            int._id === integrationId 
              ? { 
                  ...int, 
                  connected: result.data.connected,
                  connectedBy: result.data.connectedBy,
                  connectedAt: result.data.connectedAt
                } 
              : int
          )
        );
        alert(`✅ ${result.message}`);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to update integration'}`);
      }
    } catch (error) {
      console.error('Error toggling integration:', error);
      alert('❌ Failed to update integration');
    }
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
      <div className="bg-[#181818] dark:bg-[#181818] rounded-3xl opacity-0.1">
        {/* Navigation Bar */}
        <div className="w-full flex justify-center">
          <div className="flex items-start gap-4 p-4 mb-4 w-screen max-w-screen-xl">
            <div className="flex-1">
              <Navbar />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ==================== PAGE HEADER ==================== */}
          <div className="flex flex-col items-center justify-center gap-4 mb-4">
            <h3 className="text-6xl font-semibold text-[#f8f7ec] py-4">
              Project Plan
            </h3>
            
            {/* Create New Project Button - Only visible to managers */}
            {canManage && (
              <motion.button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg hover:scale-105 transition-all shadow-lg flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">✨</span>
                Create New Project
              </motion.button>
            )}
          </div>

          {/* User Role Indicator (Development/Debug) */}
          {user && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#242424] border border-[#333]">
                <span className="text-[#f8f7ec]/60 text-sm">Logged in as:</span>
                <span className="text-[#f8f7ec] font-semibold">{user.username}</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                  {user.role}
                </span>
              </div>
            </div>
          )}

        
          {/* ==================== PROJECT OVERVIEW SECTION (Always Visible) ==================== */}
          <div className="flex w-full items-center rounded-full my-6">
            <div className="flex-1 border-b border-[#f8f7ec]"></div>
            <span className="text-[#f8f7ec] text-lg font-semibold leading-8 px-8 py-3">
              Project Overview
            </span>
            <div className="flex-1 border-b border-[#f8f7ec]"></div>
          </div>

          {/* Progress Stats */}
          <div className="w-full py-20 px-6 sm:px-16 rounded-[48px] bg-white/5 border-none shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.35)] hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 ease-out relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-between gap-6 sm:gap-12">
              {/* Left Side - Progress Graph */}
              <div className="flex-1 flex justify-center items-center h-[600px] sm:h-[600px]">
                <div className="w-full h-full">
                  <ProgressBarGraph />
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden sm:block w-px bg-[#f8f7ec]/30 mx-4"></div>

              {/* Right Side - Stats Grid */}
              <div className="flex-1 text-[#f8f7ec] bg-[#181818]/1.3 rounded-2xl shadow p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {planStats.map((item, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="bg-black/80 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(255,255,255,0.1)] hover:bg-[#202020]"
                    >
                      <h3 className="text-md font-semibold text-[#f8f7ec]">{item.label}</h3>
                      <p className={`mt-1 ${item.color || "text-[#f8f7ec]"}`}>{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== PLANNING SECTION ==================== */}
          <div className="w-full py-20 px-6 sm:px-16 rounded-[48px] hover:scale-[1.01] transition-all duration-300 ease-out relative z-10">
            <div className="flex w-full items-center rounded-full my-6">
              <div className="flex-1 border-b border-[#f8f7ec]"></div>
              <span className="text-[#f8f7ec] text-lg font-semibold leading-8 px-8 py-3">
                Planning
              </span>
              <div className="flex-1 border-b border-[#f8f7ec]"></div>
            </div>
            <Planning tasks={planStats} />

            {/* Reviews and Dependencies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto">
              {/* What Others Say */}
              <div className="bg-[#242424] rounded-2xl shadow p-4 hover:bg-[#2a2a2a] transition-all">
                <h3 className="text-lg text-[#f8f7ec] font-medium mb-2">💬 What Others Say</h3>
                <ul className="space-y-2">
                  {reviews.map((r, i) => (
                    <li key={i} className="text-sm text-[#f8f7ec] p-2 bg-[#181818] rounded-lg">
                      <strong className="text-blue-400">{r.from}:</strong> {r.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Task Dependencies */}
              
            </div>
          </div>

          {/* ==================== TEAM SECTION ==================== */}
          

          
        </div>
      </div>

      {/* ==================== CREATE PROJECT MODAL ==================== */}
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </GridBackground>
  );
};

export default ProjectPlan;