const app = require('../server/src/app');
const { connectDB } = require('../server/src/config/db');

/**
 * Vercel Serverless Function entrypoint for Express API
 */
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] MongoDB connection error:', err);
  }
  return app(req, res);
};
