import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});
  }
  return socket;
}

export function joinElection(id) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join_election', id);
}

export function joinAdmin() {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join_admin');
}
