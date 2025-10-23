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
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-[#f8f7ec] text-xs font-semibold">
                {user?.username ? user.username[0].toUpperCase() : "U"}
              </div>
              
              {/* Username */}
              <span className="text-[#f8f7ec] text-sm hidden sm:inline">
                {user?.username || "User"}
                {demoMode && <span className="text-xs text-yellow-400 ml-1">(Demo)</span>}
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