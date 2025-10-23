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
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProjectPlan from "./pages/ProjectPlan";
import TeamDashboard from "./pages/TeamDashboard";

export default function App() {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      {/* Landing page - AnimatedLogin (GSAP animations intact) */}
      <Route path="/" element={<AnimatedLogin />} />
      
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

      {/* ===== CATCH ALL ===== */}
      {/* Redirect any unknown routes to login page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

