/**
 * App.jsx - Main Application Router with Authentication
 * 
 * Full stack integration:
 * - Frontend: http://localhost:5174 (Vite dev server)
 * - Backend: http://localhost:3000 (Express + MongoDB + JWT)
 * 
 * Authentication Flow:
 * 1. User lands on "/" (AnimatedLogin page)
 * 2. Login/Register → Backend validates → Returns JWT token
 * 3. Token stored in localStorage + httpOnly cookie
 * 4. Protected routes check authentication via AuthContext
 * 5. Unauthorized users redirected to login
 * 
 * Routing:
 * - "/" : AnimatedLogin (public - GSAP animations)
 * - "/dashboard", "/profile", "/chat" : Protected (requires auth)
 * - "/team" : Protected + Role-based (manager/admin only)
 * 
 * Security:
 * - ProtectedRoute wrapper checks authentication
 * - Role-based access control (RBAC) via allowedRoles prop
 * - JWT verification on backend for all API calls
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AnimatedLogin from "./pages/AnimatedLogin";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProjectPlan from "./pages/ProjectPlan";
import TeamDashboard from "./pages/TeamDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import ProjectAnalytics from "./pages/ProjectAnalytics";
import TeamAnalytics from "./pages/TeamAnalytics";
import AIInsights from "./pages/AIInsights";

export default function App() {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      {/* Landing page - AnimatedLogin (GSAP animations intact) */}
      <Route path="/" element={<AnimatedLogin />} />
      
      {/* GitHub OAuth callback */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Public informational pages */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* ===== PROTECTED ROUTES (Authentication Required) ===== */}
      
      {/* Dashboard - Main app page (all authenticated users) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* User Profile (all authenticated users) */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Chat (all authenticated users) */}
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />

      {/* Project Planning (all authenticated users) */}
      <Route 
        path="/project-plan" 
        element={
          <ProtectedRoute>
            <ProjectPlan />
          </ProtectedRoute>
        } 
      />

      {/* ===== ROLE-BASED PROTECTED ROUTES ===== */}
      
      {/* Team Dashboard - Managers and Admins only */}
      <Route 
        path="/team" 
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <TeamDashboard />
          </ProtectedRoute>
        } 
      />

      {/* ===== ANALYTICS ROUTES (Stage 7) ===== */}
      
      {/* Analytics Dashboard - All authenticated users (RBAC in backend) */}
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        } 
      />

      {/* ===== AI ASSISTANT ROUTES (Stage 8) ===== */}
      
      {/* AI Insights - Chat interface with AI assistant and PDF reports */}
      <Route 
        path="/ai-insights" 
        element={
          <ProtectedRoute>
            <AIInsights />
          </ProtectedRoute>
        } 
      />

      {/* Project-specific Analytics */}
      <Route 
        path="/projects/:projectId/analytics" 
        element={
          <ProtectedRoute>
            <ProjectAnalytics />
          </ProtectedRoute>
        } 
      />

      {/* Team-specific Analytics */}
      <Route 
        path="/teams/:teamId/analytics" 
        element={
          <ProtectedRoute>
            <TeamAnalytics />
          </ProtectedRoute>
        } 
      />

      {/* ===== AI INSIGHTS ROUTE (Stage 8) ===== */}
      
      {/* AI Assistant and Reports - All authenticated users */}
      <Route 
        path="/ai-insights" 
        element={
          <ProtectedRoute>
            <AIInsights />
          </ProtectedRoute>
        } 
      />

      {/* ===== CATCH ALL ===== */}
      {/* Redirect any unknown routes to login page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

