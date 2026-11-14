import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to backend Socket.IO (uses custom URL if provided, otherwise window location)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    // Global toast listener for key events
    socket.on('queue:token_added', (payload) => {
      toast.success(`New person added: ${payload.token?.tokenNumber} (${payload.token?.customerName})`, {
        icon: '🎟️',
      });
    });

    socket.on('queue:token_served', (payload) => {
      toast(`Now Serving: ${payload.token?.tokenNumber} (${payload.token?.customerName})`, {
        icon: '🔔',
        style: {
          border: '1px solid #C8FF00',
          background: '#0D0F0F',
          color: '#F5F3EF',
        },
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  const joinQueue = (queueId) => {
    if (socketRef.current && queueId) {
      socketRef.current.emit('queue:join', queueId);
    }
  };

  const leaveQueue = (queueId) => {
    if (socketRef.current && queueId) {
      socketRef.current.emit('queue:leave', queueId);
    }
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    joinQueue,
    leaveQueue,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
