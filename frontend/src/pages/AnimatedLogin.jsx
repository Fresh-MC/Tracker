import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';

const AnimatedLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin, apiUrl, isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Form state
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refs for animation
  const stackRef = useRef(null);
  const layer1Ref = useRef(null);
  const layer2Ref = useRef(null);
  const layer3Ref = useRef(null);
  const expandBoxRef = useRef(null);
  const stackTextRef = useRef(null);
  
  // GSAP Animation on mount
  useEffect(() => {
    const stack = stackRef.current;
    const layers = [layer1Ref.current, layer2Ref.current, layer3Ref.current];
    const expandBox = expandBoxRef.current;
    const stackText = stackTextRef.current;
    
    // Set initial position at bottom and rotated
    gsap.set(stack, { y: 1200, rotateX: 50, rotateZ: 87 });
    
    const tl = gsap.timeline();
    
    // Move up
    tl.to(stack, {
      y: 0,
      duration: 2.4,
      ease: 'power3.out'
    });
    
    // Rotate to normal, starts 0.4s after timeline starts
    tl.to(stack, {
      rotateX: 0,
      rotateZ: 0,
      duration: 1.2,
      ease: 'power3.out'
    }, 0.4);
    
    // After previous, rotate stack to 80deg
    tl.to(stack, {
      rotateZ: 80,
      duration: 0.8,
      ease: 'power2.inOut'
    });
    
    // Move layer 1 left, layer 3 right, fade out layer 2
    tl.to(layers[0], {
      x: -82,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '<');
    
    tl.to(layers[2], {
      x: 82,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '<');
    
    tl.to(layers[1], {
      opacity: 0,
      duration: 0.5,
      ease: 'power1.inOut',
      onStart: function() {
        gsap.to(stackText, { opacity: 1, duration: 1, ease: 'power1.in' });
      }
    }, '<');
    
    // After 2s delay, move layer 1 and 3 diagonally opposite and show/expand box
    tl.to([layers[0], layers[2]], {
      x: (i) => i === 0 ? '-=300' : '+=300',
      y: (i) => i === 0 ? '-=300' : '+=300',
      duration: 1.2,
      ease: 'power2.inOut',
      delay: 2,
      onStart: function() {
        gsap.to(expandBox, {
          opacity: 1,
          width: 200,
          height: 120,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: function() {
            gsap.to(expandBox, {
              width: 560,
              height: 780,
              duration: 0.8,
              ease: 'power2.out'
            });
          }
        });
      }
    });
  }, []);
  
  // Email validation
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Demo login (skip backend)
  const handleDemoLogin = (e) => {
    e.preventDefault();
    
    const demoUser = {
      id: 'demo123',
      username: 'DemoAdmin',
      email: 'demo@realpace.com',
      role: 'admin'
    };
    
    // Login without token (demo mode)
    authLogin(demoUser, null);
    
    // Navigate to dashboard
    navigate('/dashboard');
  };
  
  // Handle login - Backend Integration
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Frontend validation
    if (!isValidEmail(loginData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (loginData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call backend login API
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Success - store user data and token
      authLogin(data.user, data.token);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle signup - Backend Integration
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Frontend validation
    if (!isValidEmail(signupData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (signupData.username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    
    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call backend register API
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          role: signupData.role
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Success - store user data and token
      authLogin(data.user, data.token);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="animated-login-container">
      <style>{`
        .animated-login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          position: relative;
          gap: 100px;
          overflow: hidden;
        }
        
        .animated-login-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #181818;
          z-index: 0;
          pointer-events: none;
        }
        
        .animated-login-container::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1;
          pointer-events: none;
        }
        
        .stack {
          position: relative;
          width: 150px;
          height: 150px;
          z-index: 2;
          margin: 0 auto;
          left: 0;
          right: 0;
        }
        
        .layer {
          position: absolute;
          z-index: 1;
          width: 100%;
          height: 100%;
          transform: rotateX(34deg) rotateZ(80deg);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          filter:
            drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1))
            drop-shadow(0 0 32px 16px #fffbe6)
            drop-shadow(0 0 64px 32px #fffbe6cc)
            drop-shadow(0 0 96px 48px #fffbe6b3);
          overflow: hidden;
        }
        
        .layer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          box-shadow: inset 0 0 32px 8px rgba(0,0,0,0.18), inset 0 0 12px 2px rgba(0,0,0,0.10);
          border-radius: inherit;
          z-index: 2;
        }
        
        .filled-stack .layer:nth-child(1) {
          background: #f8f7ec;
          top: 0;
        }
        
        .filled-stack .layer:nth-child(2) {
          background: #edddd4;
          top: 15px;
        }
        
        .filled-stack .layer:nth-child(3) {
          background: #f8f7ec;
          top: 30px;
        }
        
        .stack-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -58%);
          z-index: 2;
          font-size: 75px;
          color: #283d3b;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          opacity: 0;
          pointer-events: none;
          filter: drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.2));
        }
        
        .expand-box {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: #242424;
          border-radius: 18px;
          width: 0;
          height: 0;
          opacity: 0;
          z-index: 100;
          box-shadow: 0 4px 32px 0 #0008;
          transition: box-shadow 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .expand-box form {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.2em;
          color: #fff;
        }
        
        .expand-box h2 {
          margin: 0 0 0.5em 0;
          font-size: 2.2rem;
          color: #fff;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          letter-spacing: 2px;
        }
        
        .expand-box .form-group {
          width: 80%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .expand-box input[type="text"],
        .expand-box input[type="password"],
        .expand-box input[type="email"],
        .expand-box select {
          width: 100%;
          padding: 0.7em 1em;
          border-radius: 8px;
          border: none;
          font-size: 1.1rem;
          margin-bottom: 0.5em;
          background: #222;
          color: #fff;
          outline: none;
          box-shadow: 0 2px 8px #0002;
          transition: background 0.2s;
        }
        
        .expand-box input:focus,
        .expand-box select:focus {
          background: #333;
        }
        
        .expand-box button[type="submit"] {
          padding: 0.7em 2.2em;
          border-radius: 8px;
          border: none;
          background: #f8f7ec;
          color: #242424;
          font-size: 1.1rem;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 2px 8px #0002;
          transition: background 0.2s, color 0.2s;
        }
        
        .expand-box button[type="submit"]:hover {
          background: #edddd4;
          color: #000;
        }
        
        .expand-box button[type="submit"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .tab-toggle {
          display: flex;
          width: 100%;
          justify-content: center;
          margin-bottom: 1.2em;
          gap: 1em;
        }
        
        .tab-toggle button {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.2rem;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          padding: 0.5em 1.5em;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          outline: none;
        }
        
        .tab-toggle button.active {
          background: #f8f7ec;
          color: #242424;
          font-weight: bold;
        }
        
        .error-message {
          background: #ef4444;
          color: white;
          padding: 0.7em 1em;
          border-radius: 8px;
          width: 80%;
          text-align: center;
          font-size: 0.95rem;
        }
      `}</style>
      
      {/* Filled Stack */}
      <div className="stack filled-stack" ref={stackRef}>
        <div className="layer" ref={layer1Ref}></div>
        <div className="layer" ref={layer2Ref}></div>
        <div className="layer" ref={layer3Ref}></div>
      </div>
      
    
      
      {/* Expand Box with Forms */}
      <div className="expand-box" ref={expandBoxRef}>
        <div className="tab-toggle">
          <button
            type="button"
            className={activeTab === 'login' ? 'active' : ''}
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={activeTab === 'signup' ? 'active' : ''}
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
          >
            Sign Up
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} autoComplete="off">
            <h2>Sign In</h2>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
            
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>or</span>
            </div>
            
    
          </form>
        )}
        
        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} autoComplete="off">
            <h2>Sign Up</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                required
                value={signupData.username}
                onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                required
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                required
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <select
                required
                value={signupData.role}
                onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                disabled={loading}
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AnimatedLogin;
