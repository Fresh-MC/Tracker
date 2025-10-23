/**
 * Dashboard.jsx - Stage 6: Real-time Task Validation Dashboard
 * 
 * Features:
 * - Socket.IO integration for real-time task updates
 * - Live notifications when tasks are completed via GitHub webhooks
 * - Connection status indicator
 * - Auto-refresh dashboard on task completion
 */

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import DashboardCards from "../components/DashboardCards";
import { GridBackground } from "../components/lightswind/grid-dot-background";
import { useSocket } from "../hooks/useSocket";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  // Socket.IO connection for real-time updates
  const { socket, isConnected, taskUpdated, error } = useSocket();
  
  // Notification state for task completion alerts
  const [notification, setNotification] = useState(null);
  
  // Key to force re-render DashboardCards when task updates
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handle task update events from validation engine
   */
  useEffect(() => {
    if (taskUpdated) {
      console.log('📨 Task update received in Dashboard:', taskUpdated);
      
      // Show notification
      setNotification({
        type: 'success',
        title: '🎉 Task Completed!',
        message: taskUpdated.message || `Module "${taskUpdated.module?.title}" has been completed`,
        module: taskUpdated.module
      });
      
      // Refresh dashboard data
      setRefreshKey(prev => prev + 1);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  }, [taskUpdated]);

  return (
    <GridBackground
      gridSize={24}
      gridColor="#e4e4e7"
      darkGridColor="#262626"
      showFade={true}
      fadeIntensity={30}
      className="min-h-screen px-6 py-12"
    >
      <div className="max-w-6xl mx-auto text-center space-y-8 z-20 relative">
        
        {/* Socket.IO Connection Status */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#242424] border border-[#333] shadow-lg"
        >
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[#f8f7ec] text-sm">
            {isConnected ? '🔗 Live Updates' : '❌ Disconnected'}
          </span>
        </motion.div>

        {/* Task Completion Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-20 right-4 z-50 max-w-md"
            >
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-green-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{notification.type === 'success' ? '🎉' : '⚠️'}</div>
                  <div className="flex-1">
                    <h3 className="text-[#f8f7ec] font-bold text-lg mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-[#f8f7ec]/80 text-sm mb-2">
                      {notification.message}
                    </p>
                    {notification.module && (
                      <div className="mt-3 p-3 bg-black/30 rounded-lg">
                        <p className="text-[#f8f7ec] text-sm">
                          <span className="font-semibold">Module:</span> {notification.module.title}
                        </p>
                        {notification.module.projectName && (
                          <p className="text-[#f8f7ec]/70 text-xs mt-1">
                            <span className="font-semibold">Project:</span> {notification.module.projectName}
                          </p>
                        )}
                        {notification.module.repository && (
                          <p className="text-[#f8f7ec]/70 text-xs mt-1">
                            <span className="font-semibold">Repo:</span> {notification.module.repository}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setNotification(null)}
                    className="text-[#f8f7ec]/60 hover:text-[#f8f7ec] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Socket.IO Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <p className="text-red-400">⚠️ Real-time connection error: {error}</p>
          </motion.div>
        )}
        
        {/* Main Dashboard Cards with refresh key */}
        <DashboardCards key={refreshKey} />
        
      </div>
    </GridBackground>
  );
}
