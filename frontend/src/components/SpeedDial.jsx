// SpeedDial.jsx
import React, { useState } from "react";

export default function SpeedDial() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group z-50">
      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        className="flex items-center justify-center text-[#242424] bg-[#f8f7ec] rounded-full w-14 h-14 hover:bg-indigo-700 focus:ring-4 focus:outline-none transition-all"
      >
        <svg
          className={`w-5 h-5 transform transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 18"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 1v16M1 9h16"
          />
        </svg>
        <span className="sr-only">Open actions menu</span>
      </button>

      {/* Action Buttons */}
      <div
        className={`absolute top-full mt-4 flex flex-col items-center space-y-2 transition-all ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {[1, 2, 3, 4].map((_, idx) => (
          <button
            key={idx}
            type="button"
            className="flex justify-center items-center w-14 h-14 text-gray-900 bg-white rounded-full border border-gray-300 shadow-sm hover:bg-gray-100 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
