/**
 * ProjectAnalytics Component - Project-specific analytics view
 * 
 * Features:
 * - Module breakdown by status and assignee
 * - Timeline progress visualization
 * - Completion rate and average completion time
 * - Overdue module alerts
 * - Completion trend chart (last 30 days)
 * - Real-time updates via Socket.IO
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../hooks/useSocket';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import {
  TrendingUp, Users, Clock, AlertCircle, CheckCircle, XCircle,
  ArrowLeft, Calendar, Target
} from 'lucide-react';

const ProjectAnalytics = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected } = useSocket();

  // Fetch project analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analytics/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAnalyticsData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching project analytics:', err);
      setError(err.response?.data?.message || 'Failed to load project analytics');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleModuleUpdate = (data) => {
      if (data.projectId === projectId) {
        console.log('Module updated in this project, refreshing analytics:', data);
        fetchAnalytics();
      }
    };

    socket.on('module_updated', handleModuleUpdate);
    socket.on('task_validated', handleModuleUpdate);

    return () => {
      socket.off('module_updated', handleModuleUpdate);
      socket.off('task_validated', handleModuleUpdate);
    };
  }, [socket, projectId, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Analytics</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const { project, overview, modulesByStatus, modulesByAssignee, timelineProgress, overdueModules, completionTrend } = analyticsData;

  // Chart colors
  const chartColors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6'
  };

  // Status data for pie chart
  const statusData = [
    { name: 'Completed', value: modulesByStatus.completed, color: chartColors.success },
    { name: 'In Progress', value: modulesByStatus['in-progress'], color: chartColors.primary },
    { name: 'Blocked', value: modulesByStatus.blocked, color: chartColors.danger },
    { name: 'Not Started', value: modulesByStatus['not-started'], color: '#9CA3AF' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description || 'Project Analytics'}</p>
          {project.team && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Team: {project.team}
            </span>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-blue-500" size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Total Modules</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{overview.totalModules}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Completed</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{overview.completedModules}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className={overview.completionRate >= 70 ? 'text-green-500' : 'text-orange-500'} size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Completion Rate</h3>
            <p className={`text-3xl font-bold mt-2 ${overview.completionRate >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
              {overview.completionRate}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-purple-500" size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Avg Completion Time</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {overview.avgCompletionTime > 0 ? `${overview.avgCompletionTime}d` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Timeline Progress */}
        {timelineProgress && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" />
              Timeline Progress
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Start: {new Date(timelineProgress.startDate).toLocaleDateString()}</span>
                  <span>End: {new Date(timelineProgress.endDate).toLocaleDateString()}</span>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-500 transition-all"
                    style={{ width: `${timelineProgress.timeProgress}%` }}
                  ></div>
                  <div
                    className="absolute h-full bg-green-500 transition-all"
                    style={{ width: `${timelineProgress.completionProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Time Progress: {timelineProgress.timeProgress}%</span>
                  <span>Work Progress: {timelineProgress.completionProgress}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  timelineProgress.onTrack ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {timelineProgress.onTrack ? '✓ On Track' : '⚠ Behind Schedule'}
                </span>
                <span className="text-sm text-gray-600">
                  {timelineProgress.daysRemaining} days remaining
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Modules Alert */}
        {overdueModules && overdueModules.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertCircle size={20} />
              Overdue Modules ({overdueModules.length})
            </h3>
            <div className="space-y-2">
              {overdueModules.slice(0, 5).map((module, index) => (
                <div key={index} className="bg-white rounded p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{module.title}</p>
                    <p className="text-sm text-gray-600">Assigned to: {module.assignedTo}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      module.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {module.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{module.daysInProgress} days</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Module Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Module Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No modules yet
              </div>
            )}
          </div>

          {/* Completion Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Completion Trend (30 Days)</h2>
            {completionTrend && completionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke={chartColors.success} 
                    fill={chartColors.success} 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No completion data yet
              </div>
            )}
          </div>
        </div>

        {/* Modules by Assignee */}
        {modulesByAssignee && modulesByAssignee.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Modules by Team Member
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      In Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Blocked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modulesByAssignee.map((member, index) => {
                    const completionRate = member.total > 0 
                      ? Math.round((member.completed / member.total) * 100) 
                      : 0;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {member.user.avatar ? (
                              <img 
                                src={member.user.avatar} 
                                alt={member.user.username}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-medium text-sm">
                                  {member.user.username[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {member.user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {member.completed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {member.inProgress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {member.blocked}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              {completionRate}%
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  completionRate >= 80 ? 'bg-green-500' :
                                  completionRate >= 50 ? 'bg-blue-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data updates in real-time • Last refresh: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
