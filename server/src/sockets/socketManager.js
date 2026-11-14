const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Queue = require('../models/Queue');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email role');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const managerId = socket.user._id.toString();
    console.log(`[Socket] Manager connected: ${socket.user.email} (Socket ID: ${socket.id})`);

    // Auto-join personal manager room
    socket.join(`manager:${managerId}`);

    // Join specific queue room
    socket.on('queue:join', async (queueId) => {
      try {
        if (!queueId) return;
        // Verify manager owns this queue
        const queue = await Queue.findOne({ _id: queueId, managerId });
        if (queue) {
          socket.join(`queue:${queueId}`);
          console.log(`[Socket] ${socket.user.email} joined room: queue:${queueId}`);
          socket.emit('queue:joined', { queueId, success: true });
        } else {
          socket.emit('error', { message: 'Unauthorized access to queue room' });
        }
      } catch (err) {
        console.error('[Socket] Error in queue:join:', err.message);
      }
    });

    // Leave specific queue room
    socket.on('queue:leave', (queueId) => {
      if (queueId) {
        socket.leave(`queue:${queueId}`);
        console.log(`[Socket] ${socket.user.email} left room: queue:${queueId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Broadcast helpers
const emitToQueue = (queueId, managerId, eventName, payload) => {
  if (!io) return;
  // Emit to queue room
  io.to(`queue:${queueId}`).emit(eventName, payload);
  // Also emit to manager room so dashboard/other pages stay synchronized
  if (managerId) {
    io.to(`manager:${managerId}`).emit(eventName, payload);
  }
};

const emitToManager = (managerId, eventName, payload) => {
  if (!io || !managerId) return;
  io.to(`manager:${managerId}`).emit(eventName, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToQueue,
  emitToManager,
};
