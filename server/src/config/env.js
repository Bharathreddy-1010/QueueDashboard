const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'queuepro-super-secret-jwt-key-development-2025',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  AI_MAX_TOOL_ROUNDS: parseInt(process.env.AI_MAX_TOOL_ROUNDS, 10) || 5,
  AI_RATE_LIMIT_MAX: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 30,
};

module.exports = config;
