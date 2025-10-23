/**
 * useSocket Hook - Socket.IO Client for Real-time Updates
 * 
 * Connects to the validation engine Socket.IO server on port 5002.
 * Manages connection lifecycle, event listeners, and reconnection logic.
 * 
 * Usage:
 * ```jsx
 * const { socket, isConnected, taskUpdated } = useSocket();
 * 
 * useEffect(() => {
 *   if (taskUpdated) {
 *     // Handle task update
 *     console.log('Task updated:', taskUpdated);
 *   }
 * }, [taskUpdated]);
 * ```
 * 
 * @returns {Object} - Socket instance, connection status, and event data
 */

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const VALIDATION_ENGINE_URL = 'http://localhost:5002';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [taskUpdated, setTaskUpdated] = useState(null);
  const [modulesSnapshot, setModulesSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    socketRef.current = io(VALIDATION_ENGINE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Connected to Validation Engine Socket.IO');
      setIsConnected(true);
      setError(null);
      
      // Request initial module snapshot
      socket.emit('request_modules');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Validation Engine:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO Connection Error (validation engine not running):', err.message);
      setError('Validation engine not running - real-time updates disabled');
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to Validation Engine (attempt ${attemptNumber})`);
      setIsConnected(true);
      setError(null);
    });

    // Custom event handlers
    socket.on('task_updated', (data) => {
      console.log('📨 Task Updated Event:', data);
      setTaskUpdated(data);
    });

    socket.on('modules_snapshot', (data) => {
      console.log('📊 Modules Snapshot:', data);
      setModulesSnapshot(data);
    });

    socket.on('error', (data) => {
      console.error('❌ Socket.IO Error:', data);
      setError(data.message);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('reconnect');
        socket.off('task_updated');
        socket.off('modules_snapshot');
        socket.off('error');
        socket.disconnect();
      }
    };
  }, []);

  // Method to manually request module updates
  const requestModules = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request_modules');
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    taskUpdated,
    modulesSnapshot,
    error,
    requestModules,
  };
};

export default useSocket;
