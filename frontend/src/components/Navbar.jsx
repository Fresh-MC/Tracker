import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import logo from "../assets/logo.svg";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, demoMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(false);
    };
    
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <nav className="border-b border-white/10 bg-white/10 backdrop-blur-lg shadow-md z-50 rounded-4xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative ">
        {/* Left: Logo */}
        <div className="flex items-center pl-8">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="h-6 w-6" />
            <span className="text-white font-bold text-lg">RealPace</span>
          </Link>
        </div>

        {/* Center: Nav Links (only show when authenticated) */}
        {isAuthenticated && (
          <div className="hidden md:flex space-x-8 text-[#f8f7ec] font-medium text-sm">
            <Link to="/dashboard" className="hover:text-blue-400 transition">
              Dashboard
            </Link>
            <Link to="/project-plan" className="hover:text-blue-400 transition">
              Project Plan
            </Link>
            <Link to="/team" className="hover:text-blue-400 transition">
              Team
            </Link>
            <Link to="/chat" className="hover:text-blue-400 transition">
              Chat
            </Link>
          </div>
        )}

        {/* Right: User Info or Login Button */}
        <div className="flex items-center space-x-4 pr-8">
          {isAuthenticated ? (
            <>
              {/* User Avatar */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-[#f8f7ec] text-xs font-semibold overflow-hidden">
                {user?.avatar || user?.profilePicture ? (
                  <img 
                    src={user.avatar || user.profilePicture} 
                    alt={user?.username || "User"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.username ? user.username[0].toUpperCase() : "U"}</span>
                )}
              </div>
              
              {/* Username */}
              <span className="text-[#f8f7ec] text-sm hidden sm:inline">
                {user?.name || user?.username || "User"}
                {demoMode && <span className="text-xs text-yellow-400 ml-1">(Demo)</span>}
                {user?.authProvider === 'github' && (
                  <span className="text-xs text-gray-400 ml-1" title="GitHub Account">
                    <svg className="inline w-3 h-3 ml-1" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                  </span>
                )}
              </span>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-1 text-[#f8f7ec] hover:text-red-400 transition text-sm"
                title="Logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            /* Login Button when not authenticated */
            <Link
              to="/"
              className="text-[#f8f7ec] hover:text-blue-400 transition text-sm font-medium"
            >
              Login
            </Link>
          )}

          {/* Hamburger Icon (Mobile) */}
          <button
            className="text-[#f8f7ec] md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div 
            className="absolute top-full right-0 mt-2 w-48 bg-white/20 backdrop-blur-lg rounded-md shadow-lg border border-white/10 p-3 md:hidden z-50 space-y-2 text-sm text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  to="/project-plan"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  Project Plan
                </Link>
                <Link
                  to="/team"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  Team
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  Chat
                </Link>
                <hr className="border-white/20 my-2" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left hover:text-red-400 py-2 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:text-blue-400 py-2"
                >
                  Contact
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}