import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // You can swap icons as needed
import logo from "../assets/logo.svg";


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-white/10 bg-white/10 backdrop-blur-lg shadow-md z-50 rounded-4xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative ">
        {/* Left: Logo */}
        <div className="flex items-center pl-8">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="h-6 w-6" />
            <span className="text-white font-bold text-lg">RealPace</span>
          </Link>
        </div>

        {/* Center: Nav Links (hidden on mobile) */}
        <div className="hidden md:flex space-x-8 text-[#f8f7ec] font-medium text-sm">
          <Link to="/" className="hover:text-blue-400 transition">Dashboard</Link>
          <Link to="/team-dashboard" className="hover:text-blue-400 transition">Team</Link>
        
          <Link to="/project-plan" className="hover:text-blue-400 transition">Plan</Link>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center space-x-4 pr-8">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-[#f8f7ec] text-xs font-semibold">
            U
          </div>
          <span className="text-[#f8f7ec] text-sm hidden sm:inline">Username</span>

          {/* Hamburger Icon */}
          <button
            className="text-[#f8f7ec] md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-white/20 backdrop-blur-lg rounded-md shadow-lg border border-white/10 p-3 md:hidden z-50 space-y-2 text-sm text-white">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block hover:text-blue-400">Dashboard</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)} className="block hover:text-blue-400">About</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="block hover:text-blue-400">Contact</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
