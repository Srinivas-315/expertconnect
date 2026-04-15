import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Socket.io only works in local development (not on Vercel serverless)
const IS_PRODUCTION = import.meta.env.PROD;

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Skip Socket.io entirely in production — Vercel serverless doesn't support WebSockets
    if (IS_PRODUCTION) return;
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Dynamically import socket.io-client only in development
    import('socket.io-client').then(({ io }) => {
      const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('register', user._id || user.id);
      });

      socket.on('notification', (data) => {
        const newNotif = { id: Date.now(), ...data, read: false, time: new Date() };
        setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const clearNotification = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, notifications, unreadCount, markAllRead, clearNotification }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};
