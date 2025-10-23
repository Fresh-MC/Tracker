import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {jwtDecode} from 'jwt-decode';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL params
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      // Handle error
      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      // Handle success
      if (token) {
        try {
          // Decode token to get user data
          const decoded = jwtDecode(token);
          
          const user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role
          };

          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Update AuthContext
          authLogin(user, token);

          // Redirect to dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('Error processing token:', error);
          navigate('/login?error=invalid_token');
        }
      } else {
        // No token or error, redirect to login
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, authLogin]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#181818',
      color: '#fff',
      fontSize: '1.5rem',
      fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
      letterSpacing: '2px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f8f7ec',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Authenticating with GitHub...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
