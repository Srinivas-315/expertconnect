const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const socketManager = require('./socket');

dotenv.config();
connectDB();

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : true,
  credentials: true,
}));
app.use(express.json());

// ── REST Routes ────────────────────────────────────────────
app.use('/auth',     require('./routes/auth'));
app.use('/experts',  require('./routes/experts'));
app.use('/booking',  require('./routes/bookings'));
app.use('/messages', require('./routes/messages'));
app.use('/reviews',  require('./routes/reviews'));

// ── Health check ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ExpertConnect API is running 🚀' });
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ── HTTP Server + Socket.io ────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Init socket manager so controllers can use it
socketManager.init(io);

// ── Socket.io Events ───────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── User registers their socket when they log in ──────
  socket.on('register', (userId) => {
    socketManager.addUser(userId, socket.id);
    console.log(`✅ User ${userId} registered → socket ${socket.id}`);
  });

  // ── Chat: Join a booking room ──────────────────────────
  socket.on('join-room', ({ bookingId, userName }) => {
    socket.join(bookingId);
    console.log(`👤 ${userName} joined chat room: ${bookingId}`);
    socket.to(bookingId).emit('user-joined', {
      message: `${userName} joined the chat`,
    });
  });

  // ── Chat: Send a message ───────────────────────────────
  socket.on('send-message', async ({ bookingId, senderId, senderName, text, recipientId }) => {
    try {
      const message = await Message.create({ bookingId, senderId, senderName, text });

      // Broadcast message to everyone in the room
      io.to(bookingId).emit('receive-message', {
        _id: message._id,
        senderId,
        senderName,
        text,
        createdAt: message.createdAt,
      });

      // Send "new message" notification to recipient (if not in the room)
      if (recipientId) {
        socketManager.notifyUser(recipientId, 'notification', {
          type: 'new_message',
          title: 'New Message 💬',
          message: `${senderName}: ${text.slice(0, 60)}${text.length > 60 ? '...' : ''}`,
          link: `/chat/${bookingId}`,
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Disconnect ─────────────────────────────────────────
  socket.on('disconnect', () => {
    socketManager.removeUser(socket.id);
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
