/**
 * ProtectedRoute.jsx - Route Guard for Authenticated Pages
 * 
 * Purpose:
 * - Wraps protected pages to ensure user is authenticated
 * - Redirects to login page (/) if not authenticated
 * - Supports role-based access control (RBAC)
 * 
 * Props:
 * - children: React components to render if authenticated
 * - allowedRoles: Array of roles (e.g., ['admin', 'manager']) - optional
 * 
 * Usage:
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * <Route path="/team" element={
 *   <ProtectedRoute allowedRoles={['admin', 'manager']}>
 *     <TeamDashboard />
 *   </ProtectedRoute>
 * } />
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  
  // Safe auth hook usage with error handling
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    console.error('ProtectedRoute: AuthProvider not available, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  const { user, loading } = authData;

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading...
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Verifying authentication
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login page
  if (!user) {
    // Save the location they were trying to access for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role-based access control (if roles specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
              Access Denied
            </h2>

            {/* Message */}
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Required role: <span className="font-semibold">{allowedRoles.join(' or ')}</span>
            </p>

            {/* User Info */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-600 dark:text-gray-400">Current user:</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user.username} ({user.role})
              </p>
            </div>

            {/* Back to Dashboard Button */}
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role - render children
  return children;
}
