const mongoose = require('mongoose');
const config = require('./env');

let mongoMemoryServer = null;

const connectDB = async () => {
  // Reuse existing connection if already active (serverless warm instances)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = config.MONGODB_URI || process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Attempting connection to MONGODB_URI...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[Database] Successfully connected to provided MongoDB instance.');
      return;
    } catch (err) {
      console.error(`[Database] Could not connect to provided MONGODB_URI: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  // Fallback to MongoMemoryServer only in non-production local development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI must be configured and accessible in production');
  }

  try {
    console.log('[Database] Starting embedded MongoMemoryServer (Zero-config standalone mode)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to embedded MongoMemoryServer at: ${memoryUri}`);
  } catch (error) {
    console.error('[Database] Failed to initialize MongoMemoryServer:', error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[Database] Disconnected from MongoDB.');
  } catch (err) {
    console.error('[Database] Error during disconnect:', err);
  }
};

module.exports = { connectDB, disconnectDB };
