import { io } from 'socket.io-client';
import { getToken } from './api';

export const socket = io('http://localhost:3000', {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
});