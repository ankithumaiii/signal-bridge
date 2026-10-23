import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // console.log('[Socket] Connected with ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      // console.warn('[Socket] Disconnected:', reason);
    });
  }

  return socket;
};
