const { Server } = require('socket.io');
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
  });
  io.on('connection', socket => {
    socket.on('join_election', id => socket.join(`election_${id}`));
    socket.on('join_admin',    ()  => socket.join('admin_room'));
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket not initialised');
  return io;
}

module.exports = { initSocket, getIO };