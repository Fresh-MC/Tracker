// src/components/UserDetailsCard.jsx

import React, { useState } from 'react';
import TaskForm from './TaskForm';

const UserDetailsCard = ({ user }) => {
      const [showForm, setShowForm] = useState(false);
  
  if (!user) return null;

  return (
    <div className="bg-[#181818] rounded-2xl shadow p-4 w-full sm:w-[300px] flex flex-wrap gap-4 hover:bg-[#202020] transition-all duration-300">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#f8f7ec]">
        <img
          src={user.avatar || "https://i.pravatar.cc/300"}
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-[150px] space-y-1 text-[#f8f7ec] text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Name:</span>
          <input
            type="text"
            defaultValue={user.name}
            className="bg-transparent border-b border-[#f8f7ec]/30 outline-none text-right w-1/2"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Role:</span>
          <input
            type="text"
            defaultValue={user.role}
            className="bg-transparent border-b border-[#f8f7ec]/30 outline-none text-right w-1/2"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Coins:</span>
          <span>{user.coins || 47} ⚡</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Badge:</span>
          <img
            src={user.badge || "/badge.png"}
            alt="Badge"
            className="h-6"a
          />
        </div>
      </div>
        <div className="w-full mt-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-[#10b981] text-[#181818] py-1 rounded-md font-semibold hover:bg-green-600 transition-all duration-200"
        >
          {showForm ? "Close Task Form" : "Add Task"}
        </button>
      </div>
      {/* Task Form */}
      {showForm && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-[#181818] p-6 rounded-xl shadow-xl w-full max-w-md mx-auto text-center">
      <h2 className="text-lg font-semibold text-[#f8f7ec] mb-4">Want to add a task?</h2>

      <div className="flex justify-center gap-4">
        <button
          className="bg-[#f8f7ec] text-black px-4 py-2 rounded hover:bg-gray-200"
          onClick={() => {
            window.location.href = "/#/task-form"; // ✅ Redirect to full page
          }}
        >
          Go to Task Form
        </button>
        <button
          className="text-[#f8f7ec] underline hover:text-red-300"
          onClick={() => setShowForm(false)} // ❌ Close modal
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
      {/* Quick Links */}
      <div className="w-full flex gap-2 mt-2">
        <a
          href={user.github || "https://github.com/yourusername"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 text-xs underline"
        >
          GitHub
        </a>
        <a
          href={user.dashboard || "/dashboard"}
          className="text-blue-400 text-xs underline"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
};

export default UserDetailsCard;

