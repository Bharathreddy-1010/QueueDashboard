const config = require('../config/env');

// In-memory sliding window store: Map<key, number[]>
const requestWindowMap = new Map();

// Periodic cleanup of stale rate limiter entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  for (const [key, timestamps] of requestWindowMap.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      requestWindowMap.delete(key);
    } else {
      requestWindowMap.set(key, valid);
    }
  }
}, 5 * 60 * 1000);

const aiRateLimit = (req, res, next) => {
  const identifier = req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const limit = config.AI_RATE_LIMIT_MAX || 30;

  let timestamps = requestWindowMap.get(identifier) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const oldestTimestamp = timestamps[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldestTimestamp)) / 1000);

    return res.status(429).json({
      success: false,
      message: `AI rate limit exceeded. Please wait ${retryAfterSeconds} second(s) before sending another query.`,
      retryAfterSeconds,
    });
  }

  timestamps.push(now);
  requestWindowMap.set(identifier, timestamps);
  next();
};

module.exports = aiRateLimit;
