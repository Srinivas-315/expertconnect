/**
 * Socket singleton — lets controllers emit notifications
 * without needing access to the `io` instance directly.
 */
let io;

// Connected users map: userId (string) → socketId (string)
const connectedUsers = new Map();

const init = (socketIo) => {
  io = socketIo;
};

const getIo = () => io;

const addUser = (userId, socketId) => {
  connectedUsers.set(userId.toString(), socketId);
};

const removeUser = (socketId) => {
  for (const [userId, sid] of connectedUsers.entries()) {
    if (sid === socketId) {
      connectedUsers.delete(userId);
      break;
    }
  }
};

// Emit a notification to a specific user by their MongoDB userId
const notifyUser = (userId, event, data) => {
  if (!io) return;
  const socketId = connectedUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

module.exports = { init, getIo, addUser, removeUser, notifyUser, connectedUsers };
