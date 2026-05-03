import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket connection with JWT auth.
 * Should be called once after login.
 */
export function connectSocket() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  // Avoid duplicate connections
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
}

/**
 * Get the current socket instance.
 * @returns {import('socket.io-client').Socket|null}
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect socket. Should be called on logout.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
