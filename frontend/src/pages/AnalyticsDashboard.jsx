/**
 * AnalyticsDashboard Component - Stage 7 Analytics Dashboard
 * 
 * Features:
 * - KPI cards (total projects, modules, completion rate, etc.)
 * - Completion trends chart (last 30 days)
 * - Module status distribution (pie/donut chart)
 * - Top performers leaderboard
 * - Real-time updates via Socket.IO
 * - RBAC-aware data display
 * - Alerts and insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useSocket from '../hooks/useSocket';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, Target, AlertTriangle, Award, Activity
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected } = useSocket();

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analytics/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAnalyticsData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleModuleUpdate = (data) => {
      console.log('Module updated, refreshing analytics:', data);
      fetchAnalytics();
    };

    const handleTaskValidated = (data) => {
      console.log('Task validated, refreshing analytics:', data);
      fetchAnalytics();
    };

    socket.on('module_updated', handleModuleUpdate);
    socket.on('task_validated', handleTaskValidated);

    return () => {
      socket.off('module_updated', handleModuleUpdate);
      socket.off('task_validated', handleTaskValidated);
    };
  }, [socket, fetchAnalytics]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
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

  const { overview, recentActivity, topPerformers, alerts, userRole, accessLevel } = analyticsData;

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const chartColors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };

  // Status distribution data for pie chart
  const statusData = [
    { name: 'Completed', value: overview.completedModules, color: chartColors.success },
    { name: 'In Progress', value: overview.inProgressModules, color: chartColors.primary },
    { name: 'Blocked', value: overview.blockedModules, color: chartColors.danger },
    { name: 'Not Started', value: overview.totalModules - overview.completedModules - overview.inProgressModules - overview.blockedModules, color: '#9CA3AF' }
  ].filter(item => item.value > 0);

  // KPI Cards
  const kpiCards = [
    {
      title: 'Total Projects',
      value: overview.totalProjects,
      icon: <Target className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      subtitle: `${overview.activeProjects} active`
    },
    {
      title: 'Total Modules',
      value: overview.totalModules,
      icon: <Activity className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtitle: `${overview.inProgressModules} in progress`
    },
    {
      title: 'Completion Rate',
      value: `${overview.overallCompletionRate}%`,
      icon: <TrendingUp className={overview.overallCompletionRate >= 70 ? 'text-green-500' : 'text-orange-500'} size={24} />,
      bgColor: overview.overallCompletionRate >= 70 ? 'bg-green-50' : 'bg-orange-50',
      textColor: overview.overallCompletionRate >= 70 ? 'text-green-600' : 'text-orange-600',
      subtitle: `${overview.completedModules} completed`
    },
    {
      title: 'Recent Activity',
      value: recentActivity.last7Days,
      icon: <Award className="text-pink-500" size={24} />,
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      subtitle: 'Last 7 days'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {accessLevel === 'full' ? 'Organization-wide analytics' :
             accessLevel === 'team' ? 'Team analytics' : 'Personal analytics'}
          </p>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.type === 'success' ? 'bg-green-50 border-green-200' :
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                  alert.type === 'info' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={
                      alert.type === 'success' ? 'text-green-600' :
                      alert.type === 'warning' ? 'text-orange-600' :
                      alert.type === 'info' ? 'text-blue-600' :
                      'text-gray-600'
                    }
                    size={20}
                  />
                  <div>
                    <p className={`font-medium ${
                      alert.type === 'success' ? 'text-green-800' :
                      alert.type === 'warning' ? 'text-orange-800' :
                      alert.type === 'info' ? 'text-blue-800' :
                      'text-gray-800'
                    }`}>
                      {alert.message}
                    </p>
                    {alert.priority && (
                      <span className={`text-xs mt-1 inline-block px-2 py-1 rounded ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-700' :
                        alert.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.priority} priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  {card.icon}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className={`text-3xl font-bold ${card.textColor} mb-1`}>{card.value}</p>
              <p className="text-gray-500 text-xs">{card.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Module Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={20} className="text-blue-500" />
              Module Status Distribution
            </h2>
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
                No data available
              </div>
            )}
          </div>

          {/* Projects Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-purple-500" />
              Projects Overview
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Total', value: overview.totalProjects, fill: chartColors.purple },
                  { name: 'Active', value: overview.activeProjects, fill: chartColors.primary },
                  { name: 'Completed', value: overview.completedProjects, fill: chartColors.success }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={chartColors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers - Only visible for managers/team leads */}
        {accessLevel !== 'personal' && topPerformers && topPerformers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Top Performers
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topPerformers.map((performer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        } font-bold`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {performer.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{performer.completed}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{performer.total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 mr-2">
                            {performer.completionRate}%
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                performer.completionRate >= 80 ? 'bg-green-500' :
                                performer.completionRate >= 50 ? 'bg-blue-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${performer.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data updates in real-time • Last refresh: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
