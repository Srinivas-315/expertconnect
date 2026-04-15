const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── CORS — allow all Vercel deployments + localhost ────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);
    // Allow localhost
    if (origin.includes('localhost')) return callback(null, true);
    // Allow all vercel.app domains
    if (origin.includes('vercel.app')) return callback(null, true);
    // Allow custom domain if set
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
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

// ── Socket.io — only in development (not supported on Vercel free tier) ──
if (process.env.NODE_ENV !== 'production') {
  const http = require('http');
  const { Server } = require('socket.io');
  const Message = require('./models/Message');
  const socketManager = require('./socket');

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  socketManager.init(io);

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('register', (userId) => {
      socketManager.addUser(userId, socket.id);
    });

    socket.on('join-room', ({ bookingId, userName }) => {
      socket.join(bookingId);
      socket.to(bookingId).emit('user-joined', { message: `${userName} joined the chat` });
    });

    socket.on('send-message', async ({ bookingId, senderId, senderName, text, recipientId }) => {
      try {
        const message = await Message.create({ bookingId, senderId, senderName, text });
        io.to(bookingId).emit('receive-message', {
          _id: message._id, senderId, senderName, text, createdAt: message.createdAt,
        });
        if (recipientId) {
          socketManager.notifyUser(recipientId, 'notification', {
            type: 'new_message',
            title: 'New Message 💬',
            message: `${senderName}: ${text.slice(0, 60)}`,
            link: `/chat/${bookingId}`,
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      socketManager.removeUser(socket.id);
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

// ── Export for Vercel serverless ───────────────────────────
module.exports = app;
