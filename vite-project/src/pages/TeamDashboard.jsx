// TeamDashboard.jsx
import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Code2, Shield, Users } from "lucide-react";
import Input from "../components/Input.jsx";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SpeedDial from "../components/SpeedDial";
import ZoomCards from "../components/HoverCard";
import { GridBackground } from "../components/lightswind/grid-dot-background";

const mockData = [
  { name: "Alice", role: "Developer", completed: 12, total: 15 },
  { name: "Bob", role: "Manager", completed: 9, total: 10 },
  { name: "Carol", role: "Security", completed: 7, total: 14 },
  { name: "Dave", role: "Developer", completed: 10, total: 15 },
  { name: "Eve", role: "Manager", completed: 8, total: 10 },
  { name: "Frank", role: "Security", completed: 6, total: 14 },
  { name: "Grace", role: "Developer", completed: 11, total: 15 },

  { name: "Heidi", role: "Manager", completed: 10, total: 10 },
  { name: "Ivan", role: "Security", completed: 5, total:
  14 },
    { name: "Judy", role: "Developer", completed: 13, total: 15 },
    { name: "Karl", role: "Manager", completed: 9, total: 10 },
    { name: "Leo", role: "Security", completed: 8, total: 14 },
];

const getRoleIcon = (role) => {
  switch (role) {
    case "Developer":
      return <Code2 className="text-blue-500" />;
    case "Manager":
      return <Users className="text-green-500" />;
    case "Security":
      return <Shield className="text-red-500" />;
    default:
      return null;
  }
};

export default function TeamDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setUsers(mockData);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );
  

  const sortedLeaderboard = [...users].sort(
    (a, b) => b.completed / b.total - a.completed / a.total
  );

  return (
    <GridBackground
      gridSize={24}
      gridColor="#e4e4e7"
      darkGridColor="#262626"
      showFade={true}
      fadeIntensity={30}
      className="min-h-screen px-6 py-12"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Sidebar SpeedDial */}
        <SpeedDial />

        {/* Main Content */}
        <div className="w-full">
          <Navbar />

          {/* Hero Header Section */}
          <div className="mt-6 bg-[#181818] rounded-3xl">
            <div className="min-h-screen w-full flex items-center justify-center px-4">
              <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-12">
                
                {/* Search Bar */}
                <div className="mb-4 w-full">
                  <Input
  placeholder="Search by name or role..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="text-[#181818] placeholder-gray-400 bg-[#f8f7ec] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f8f7ec]"
/>

                </div>

                {/* Leaderboard */}
                <div className="mb-6 bg-[#242424] p-4 rounded-xl shadow w-full">
                  <h2 className="text-xl text-[#f8f7ec] font-semibold mb-2">Leaderboard</h2>
                  
                  <ul>
                    {sortedLeaderboard.slice(0, 3).map((user, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex justify-between py-1 text-[#f8f7ec] "
                      >
                        <span>
                          {i + 1}. {user.name} ({user.role})
                        </span>
                        <span>
                          {Math.round((user.completed / user.total) * 100)}%
                          complete
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* User Cards Section */}
                <div className="flex flex-wrap gap-4 justify-center">
               {filteredUsers.map((user, i) => {
  const percent = Math.round((user.completed / user.total) * 100);
  return (
   
    <motion.div
      key={i}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: i * 0.1 }}
      className="relative group bg-[#242424] text-[#f8f7ec] hover:bg-[#202020] hover:text-[#f8f7fc] rounded-xl shadow p-4 flex flex-col items-center"
    >
      <div className="text-lg font-semibold flex items-center gap-2 mb-2">
        {getRoleIcon(user.role)} {user.name}
      </div>

      <div className="w-24 h-24 mb-3">
        <CircularProgressbar
          value={percent}
          text={`${percent}%`}
          styles={buildStyles({
            pathColor: "#10b981",
            textColor: "#1f2937",
          })}
        />
      </div>

      <p className="text-[#f8f7ec] mb-2">
        {user.completed}/{user.total} tasks completed
      </p>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto flex items-center justify-center flex-col gap-2 transition-opacity duration-300 rounded-xl z-10">
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-amber-50  "> 
          View Tasks
        </button>
        <label className="bg-white text-black px-4 py-1 rounded cursor-pointer hover:bg-gray-200">
          Upload Proof
          <input type="file" className="hidden" />
        </label>
      </div>
    </motion.div>
  );
})}
</div>



               
                {/* Final Divider */}
                <div className="flex w-full items-center rounded-full my-6">
                  <div className="flex-1 border-b border-[#f8f7ec]"></div>
                  <div className="flex-1 border-b border-[#f8f7ec]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </GridBackground>
  );
}
