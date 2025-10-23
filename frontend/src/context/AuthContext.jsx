/**
 * AuthContext.jsx - Global Authentication State Management
 * 
 * Full Backend Integration:
 * - Connects to Express + MongoDB backend at localhost:3000
 * - JWT authentication with httpOnly cookies + localStorage
 * - Automatic auth verification on page load
 * - Role-based access control (user, manager, admin)
 * 
 * Provides:
 * - user: Current user object (id, username, email, role)
 * - token: JWT token for API requests
 * - loading: Loading state during auth check
 * - login(userData, token): Store user and token after backend login
 * - logout(): Clear auth and call backend logout endpoint
 * - updateUser(userData): Update user info in state
 * - checkAuth(): Verify current authentication status with backend
 * - isAuthenticated: Boolean - is user logged in?
 * - apiUrl: Backend API base URL from .env
 * 
 * Environment Variables:
 * - VITE_API_URL: Backend API base URL (default: http://localhost:3000)
 * 
 * Usage:
 * import { useAuth } from './context/AuthContext';
 * const { user, login, logout, isAuthenticated, checkAuth } = useAuth();
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Check authentication status with backend
  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // If no token but has stored user (demo mode), use that
    if (!storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setDemoMode(true);
        setLoading(false);
        return true;
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
    
    if (!storedToken) {
      setLoading(false);
      return false;
    }

    try {
      // Verify token with backend
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        setToken(storedToken);
        setDemoMode(false);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Auth check failed - switching to demo mode:', error);
      
      // Fallback to demo mode if stored user exists
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setDemoMode(true);
          return true;
        } catch (parseError) {
          console.error('Failed to parse stored user:', parseError);
        }
      }
      
      // Clear invalid token
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setDemoMode(!authToken); // If no token, it's demo mode
    localStorage.setItem('user', JSON.stringify(userData));
    if (authToken) {
      localStorage.setItem('token', authToken);
    }
  };

  const logout = async () => {
    // Only call backend if we have a real token (not in demo mode)
    if (token && !demoMode) {
      try {
        // Call backend logout endpoint to clear httpOnly cookie
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local state regardless of backend response
    setUser(null);
    setToken(null);
    setDemoMode(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('demoUser');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Refresh GitHub stats by calling sync endpoint
  const refreshGitHubStats = async () => {
    if (!token || demoMode || !user) {
      console.warn('Cannot sync GitHub stats: Not authenticated or in demo mode');
      return { success: false, message: 'Authentication required' };
    }

    try {
      const response = await fetch(`${API_URL}/api/github/sync`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Update user with new GitHub stats
        const updatedUser = {
          ...user,
          githubUsername: data.data.githubUsername,
          githubStats: data.data.githubStats,
          lastSync: data.data.lastSync
        };
        updateUser(updatedUser);
        return { success: true, data: data.data };
      } else {
        console.error('Failed to sync GitHub stats:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error syncing GitHub stats:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const value = {
    user,
    token,
    loading,
    demoMode,
    login,
    logout,
    updateUser,
    checkAuth,
    refreshGitHubStats, // New function to sync GitHub data
    isAuthenticated: !!user,
    apiUrl: API_URL // Expose API URL for components that need it
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
