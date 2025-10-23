/**
 * TeamAnalytics Component - Team performance analytics
 * 
 * Features:
 * - Team performance leaderboard
 * - Individual contribution charts
 * - Team velocity metrics (weekly trend)
 * - At-risk members identification
 * - Export to CSV functionality
 * - Real-time updates via Socket.IO
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../hooks/useSocket';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, TrendingUp, Award, AlertTriangle, Download, ArrowLeft,
  Activity, Target
} from 'lucide-react';

const TeamAnalytics = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected } = useSocket();

  // Fetch team analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analytics/teams/${teamId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAnalyticsData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching team analytics:', err);
      setError(err.response?.data?.message || 'Failed to load team analytics');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
      console.log('Team data updated, refreshing analytics:', data);
      fetchAnalytics();
    };

    socket.on('module_updated', handleUpdate);
    socket.on('task_validated', handleUpdate);

    return () => {
      socket.off('module_updated', handleUpdate);
      socket.off('task_validated', handleUpdate);
    };
  }, [socket, fetchAnalytics]);

  // Export to CSV
  const exportToCSV = () => {
    if (!analyticsData) return;

    const { team, leaderboard } = analyticsData;
    
    // Prepare CSV data
    const headers = ['Rank', 'Username', 'Email', 'Role', 'Tasks Completed', 'Tasks In Progress', 'Tasks Blocked', 'Total Tasks', 'Completion Rate (%)', 'Avg Completion Time (days)'];
    
    const rows = leaderboard.map((member, index) => [
      index + 1,
      member.user.username,
      member.user.email,
      member.user.role,
      member.tasksCompleted,
      member.tasksInProgress,
      member.tasksBlocked,
      member.totalTasks,
      member.completionRate,
      member.avgCompletionTime
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${team.name}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const { team, overview, leaderboard, velocity, avgVelocity, atRiskMembers } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600 mt-1">{team.description || 'Team Analytics'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {team.memberCount} members
              </span>
              {team.project && (
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Project: {team.project}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Download size={18} />
            Export CSV
          </button>
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
              <TrendingUp className={overview.completionRate >= 70 ? 'text-green-500' : 'text-orange-500'} size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Completion Rate</h3>
            <p className={`text-3xl font-bold mt-2 ${overview.completionRate >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
              {overview.completionRate}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-purple-500" size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Avg Velocity</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{avgVelocity}</p>
            <p className="text-xs text-gray-500 mt-1">modules/week</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-pink-500" size={24} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Projects</h3>
            <p className="text-3xl font-bold text-pink-600 mt-2">{overview.projectCount}</p>
          </div>
        </div>

        {/* At-Risk Members Alert */}
        {atRiskMembers && atRiskMembers.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={20} />
              At-Risk Members ({atRiskMembers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {atRiskMembers.map((member, index) => (
                <div key={index} className="bg-white rounded p-3">
                  <p className="font-medium text-gray-900">{member.username}</p>
                  <p className="text-sm text-gray-600 mt-1">{member.reason}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-orange-600">Completion: {member.completionRate}%</span>
                    <span className="text-red-600">Blocked: {member.tasksBlocked}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Team Velocity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-purple-500" />
              Team Velocity (Last 4 Weeks)
            </h2>
            {velocity && velocity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={velocity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Modules Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No velocity data yet
              </div>
            )}
          </div>

          {/* Top Contributors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Top 5 Contributors
            </h2>
            {leaderboard && leaderboard.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaderboard.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user.username" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasksCompleted" fill="#10B981" name="Completed" />
                  <Bar dataKey="tasksInProgress" fill="#3B82F6" name="In Progress" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No contribution data yet
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Team Leaderboard
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Member
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
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Avg Time (days)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((member, index) => (
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.user.username}
                            </div>
                            <div className="text-xs text-gray-500">{member.user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {member.tasksCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {member.tasksInProgress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {member.tasksBlocked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.totalTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {member.completionRate}%
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                member.completionRate >= 80 ? 'bg-green-500' :
                                member.completionRate >= 50 ? 'bg-blue-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${member.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.avgCompletionTime > 0 ? member.avgCompletionTime.toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
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

export default TeamAnalytics;
