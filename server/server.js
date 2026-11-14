const http = require('http');
const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/sockets/socketManager');
const User = require('./src/models/User');
const { runSeed } = require('./src/scripts/seed');

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Check if DB is empty and auto-seed for instant demo access
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Startup] Database is empty. Seeding demo manager and queues...');
      await runSeed();
    }

    // 3. Create HTTP server and initialize Socket.IO
    const server = http.createServer(app);
    initSocket(server);

    // 4. Start listening
    const PORT = config.PORT;
    server.listen(PORT, () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 QueuePro Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`👤 Demo Account: manager@queuepro.com / Password123!`);
      console.log(`⚙️  Environment: ${config.NODE_ENV}`);
      console.log('----------------------------------------------------');
    });

    const shutdown = () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP and Socket server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
