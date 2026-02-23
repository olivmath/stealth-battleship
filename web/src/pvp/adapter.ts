// PvP adapter — Socket.io connection wrapper

import { io, Socket } from 'socket.io-client';
import { signAuth, SignerKeys } from './signer';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const TAG = '[PvP:adapter]';

let socket: Socket | null = null;
let currentKeys: SignerKeys | null = null;

export function connect(keys: SignerKeys): Socket {
  if (socket?.connected) {
    console.debug(TAG, 'Already connected, reusing socket', socket.id);
    return socket;
  }

  currentKeys = keys;
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2);
  const auth = signAuth(keys, timestamp, nonce);

  console.debug(TAG, 'Connecting to', WS_URL);
  console.debug(TAG, 'Auth pubKey:', keys.publicKeyHex.slice(0, 12) + '...');

  socket = io(WS_URL, {
    auth,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.debug(TAG, 'Connected! socketId:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error(TAG, 'Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn(TAG, 'Disconnected:', reason);
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.debug(TAG, `Reconnect attempt #${attempt}`);
  });

  socket.io.on('reconnect', (attempt) => {
    console.debug(TAG, `Reconnected after ${attempt} attempts`);
  });

  socket.io.on('reconnect_failed', () => {
    console.error(TAG, 'Reconnection failed after all attempts');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function getKeys(): SignerKeys | null {
  return currentKeys;
}

export function disconnect(): void {
  if (socket) {
    console.debug(TAG, 'Disconnecting socket', socket.id);
    socket.disconnect();
    socket = null;
    currentKeys = null;
  }
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
