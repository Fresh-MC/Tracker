/**
 * main.jsx - Entry Point with Full Authentication
 * 
 * Integrated with backend authentication system:
 * - AuthProvider wraps entire app for global auth state
 * - Manages user login/logout across all components
 * - Connects to backend API at localhost:3000
 * 
 * Stack:
 * - Frontend: http://localhost:5174 (Vite dev server)
 * - Backend: http://localhost:3000 (Express + MongoDB)
 * - Auth: JWT tokens with httpOnly cookies
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
