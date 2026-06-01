import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

let socket: Socket | null = null;

export const connectWebSocket = (): Socket => {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      auth: {
        token: localStorage.getItem('token'),
      },
    });
  }
  return socket;
};

export const disconnectWebSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
