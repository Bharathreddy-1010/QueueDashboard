const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Attempting connection to MONGODB_URI: ${uri.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[Database] Successfully connected to provided MongoDB instance.');
      return;
    } catch (err) {
      console.warn(`[Database] Could not connect to provided MONGODB_URI (${err.message}). Falling back to MongoMemoryServer...`);
    }
  }

  // Fallback to MongoMemoryServer
  try {
    console.log('[Database] Starting embedded MongoMemoryServer (Zero-config standalone mode)...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to embedded MongoMemoryServer at: ${memoryUri}`);
  } catch (error) {
    console.error('[Database] Failed to initialize MongoMemoryServer:', error);
    process.exit(1);
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
