const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Token = require('../models/Token');
const QueueEvent = require('../models/QueueEvent');
const { emitToQueue, emitToManager } = require('../sockets/socketManager');

/**
 * Formats token counter into standard string (e.g. T001, T002)
 */
const formatTokenNumber = (prefix = 'T', num = 1) => {
  return `${prefix}${String(num).padStart(3, '0')}`;
};

/**
 * Recompacts positions of WAITING tokens in a queue to guarantee continuous 1..N order
 */
const recompactPositions = async (queueId) => {
  const waitingTokens = await Token.find({ queueId, status: 'WAITING' }).sort({ position: 1, createdAt: 1 });
  if (waitingTokens.length === 0) return 0;

  const bulkOps = waitingTokens.map((t, idx) => ({
    updateOne: {
      filter: { _id: t._id },
      update: { $set: { position: idx + 1 } },
    },
  }));

  await Token.bulkWrite(bulkOps);
  return waitingTokens.length;
};

/**
 * Add a new person to a queue
 */
const addTokenToQueue = async ({ queueId, customerName, phoneNumber, managerId }) => {
  const queue = await Queue.findOne({ _id: queueId, managerId });
  if (!queue) {
    const error = new Error('Queue not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (queue.status !== 'ACTIVE') {
    const error = new Error('Queue is currently inactive. Please activate it first.');
    error.statusCode = 400;
    throw error;
  }

  // Atomically increment nextTokenNumber on the queue
  const updatedQueue = await Queue.findOneAndUpdate(
    { _id: queueId, managerId },
    { $inc: { nextTokenNumber: 1 } },
    { new: false } // returns document before increment so we use that number
  );

  const tokenNumberStr = formatTokenNumber(queue.prefix || 'T', updatedQueue.nextTokenNumber);

  // Determine current waiting count and new position
  const currentWaitingCount = await Token.countDocuments({ queueId, status: 'WAITING' });
  const position = currentWaitingCount + 1;

  const token = await Token.create({
    queueId,
    tokenNumber: tokenNumberStr,
    customerName,
    phoneNumber: phoneNumber || '',
    status: 'WAITING',
    position,
  });

  // Record queue event
  await QueueEvent.create({
    queueId,
    tokenId: token._id,
    eventType: 'TOKEN_ADDED',
    previousPosition: null,
    newPosition: position,
    waitingCount: position,
    timestamp: new Date(),
    metadata: {
      tokenNumber: token.tokenNumber,
      customerName: token.customerName,
    },
  });

  // Broadcast event
  emitToQueue(queueId, managerId, 'queue:token_added', {
    queueId,
    token,
    waitingCount: position,
  });

  return token;
};

/**
 * Reorder waiting tokens (move up or down)
 */
const moveToken = async ({ tokenId, direction, targetPosition, managerId }) => {
  const token = await Token.findById(tokenId);
  if (!token) {
    const error = new Error('Token not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify manager owns the queue
  const queue = await Queue.findOne({ _id: token.queueId, managerId });
  if (!queue) {
    const error = new Error('Queue not found or unauthorized');
    error.statusCode = 403;
    throw error;
  }

  if (token.status !== 'WAITING') {
    const error = new Error(`Cannot reorder token with status '${token.status}'. Only WAITING tokens can be moved.`);
    error.statusCode = 400;
    throw error;
  }

  const currentPos = token.position;
  const totalWaiting = await Token.countDocuments({ queueId: token.queueId, status: 'WAITING' });

  let newPos = currentPos;

  if (direction === 'up') {
    if (currentPos <= 1) {
      const error = new Error('Token is already at the first position in the queue');
      error.statusCode = 400;
      throw error;
    }
    newPos = currentPos - 1;
  } else if (direction === 'down') {
    if (currentPos >= totalWaiting) {
      const error = new Error('Token is already at the last position in the queue');
      error.statusCode = 400;
      throw error;
    }
    newPos = currentPos + 1;
  } else if (direction === 'top') {
    newPos = 1;
  } else if (direction === 'bottom') {
    newPos = totalWaiting;
  } else if (targetPosition) {
    if (targetPosition < 1 || targetPosition > totalWaiting) {
      const error = new Error(`Target position must be between 1 and ${totalWaiting}`);
      error.statusCode = 400;
      throw error;
    }
    newPos = targetPosition;
  }

  if (newPos === currentPos) {
    return token;
  }

  // Swap or shift positions
  if (direction === 'up' || direction === 'down') {
    // Simple 2-token swap
    const otherToken = await Token.findOne({
      queueId: token.queueId,
      status: 'WAITING',
      position: newPos,
    });

    if (otherToken) {
      // Temporary position to avoid unique conflict if indexed
      await Token.updateOne({ _id: token._id }, { $set: { position: -1 } });
      await Token.updateOne({ _id: otherToken._id }, { $set: { position: currentPos } });
      await Token.updateOne({ _id: token._id }, { $set: { position: newPos } });
    } else {
      await Token.updateOne({ _id: token._id }, { $set: { position: newPos } });
    }
  } else {
    // Complex shift (e.g. move to top or bottom)
    if (newPos < currentPos) {
      // Shift tokens between newPos and currentPos - 1 UP by 1 (position + 1)
      await Token.updateMany(
        { queueId: token.queueId, status: 'WAITING', position: { $gte: newPos, $lt: currentPos } },
        { $inc: { position: 1 } }
      );
    } else {
      // Shift tokens between currentPos + 1 and newPos DOWN by 1 (position - 1)
      await Token.updateMany(
        { queueId: token.queueId, status: 'WAITING', position: { $gt: currentPos, $le: newPos } },
        { $inc: { position: -1 } }
      );
    }
    await Token.updateOne({ _id: token._id }, { $set: { position: newPos } });
  }

  // Ensure positions are continuous
  await recompactPositions(token.queueId);

  const updatedToken = await Token.findById(tokenId);

  // Record queue event
  await QueueEvent.create({
    queueId: token.queueId,
    tokenId: token._id,
    eventType: 'TOKEN_MOVED',
    previousPosition: currentPos,
    newPosition: updatedToken.position,
    waitingCount: totalWaiting,
    timestamp: new Date(),
    metadata: { direction, tokenNumber: token.tokenNumber },
  });

  // Broadcast event
  emitToQueue(token.queueId, managerId, 'queue:token_moved', {
    queueId: token.queueId,
    token: updatedToken,
    previousPosition: currentPos,
    newPosition: updatedToken.position,
  });

  return updatedToken;
};

/**
 * Serve next token (atomic concurrency safe)
 */
const serveNextToken = async ({ queueId, managerId }) => {
  const queue = await Queue.findOne({ _id: queueId, managerId });
  if (!queue) {
    const error = new Error('Queue not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  // Find lowest position waiting token
  const firstWaiting = await Token.findOne({ queueId, status: 'WAITING' }).sort({ position: 1, createdAt: 1 });
  if (!firstWaiting) {
    const error = new Error('No waiting tokens in this queue to serve');
    error.statusCode = 400;
    throw error;
  }

  // Concurrency-safe atomic findOneAndUpdate
  // Only succeeds if token status is still 'WAITING'
  const servedToken = await Token.findOneAndUpdate(
    { _id: firstWaiting._id, status: 'WAITING' },
    {
      $set: {
        status: 'IN_SERVICE',
        calledAt: new Date(),
        position: null,
      },
    },
    { new: true }
  );

  if (!servedToken) {
    const error = new Error('Token was already served or modified by another request. Please try again.');
    error.statusCode = 409;
    throw error;
  }

  // Recompact remaining waiting tokens
  const remainingWaitingCount = await recompactPositions(queueId);

  // Record queue event
  await QueueEvent.create({
    queueId,
    tokenId: servedToken._id,
    eventType: 'TOKEN_CALLED',
    previousPosition: firstWaiting.position,
    newPosition: null,
    waitingCount: remainingWaitingCount,
    timestamp: new Date(),
    metadata: {
      tokenNumber: servedToken.tokenNumber,
      customerName: servedToken.customerName,
      waitingDurationSeconds: servedToken.waitingTimeSeconds,
    },
  });

  // Broadcast event
  emitToQueue(queueId, managerId, 'queue:token_served', {
    queueId,
    token: servedToken,
    waitingCount: remainingWaitingCount,
  });

  return servedToken;
};

/**
 * Complete service for a token
 */
const completeService = async ({ tokenId, managerId }) => {
  const token = await Token.findById(tokenId);
  if (!token) {
    const error = new Error('Token not found');
    error.statusCode = 404;
    throw error;
  }

  const queue = await Queue.findOne({ _id: token.queueId, managerId });
  if (!queue) {
    const error = new Error('Queue not found or unauthorized');
    error.statusCode = 403;
    throw error;
  }

  if (token.status !== 'IN_SERVICE') {
    const error = new Error(`Cannot complete service for a token with status '${token.status}'. Must be IN_SERVICE.`);
    error.statusCode = 400;
    throw error;
  }

  token.status = 'COMPLETED';
  token.completedAt = new Date();
  token.position = null;
  await token.save();

  const waitingCount = await Token.countDocuments({ queueId: token.queueId, status: 'WAITING' });

  // Record queue event
  await QueueEvent.create({
    queueId: token.queueId,
    tokenId: token._id,
    eventType: 'TOKEN_COMPLETED',
    previousPosition: null,
    newPosition: null,
    waitingCount,
    timestamp: new Date(),
    metadata: {
      tokenNumber: token.tokenNumber,
      customerName: token.customerName,
      serviceDurationSeconds: token.serviceDurationSeconds,
    },
  });

  // Broadcast event
  emitToQueue(token.queueId, managerId, 'queue:token_completed', {
    queueId: token.queueId,
    token,
    waitingCount,
  });

  return token;
};

/**
 * Cancel a token (WAITING or IN_SERVICE)
 */
const cancelToken = async ({ tokenId, reason = 'Cancelled by manager', managerId }) => {
  const token = await Token.findById(tokenId);
  if (!token) {
    const error = new Error('Token not found');
    error.statusCode = 404;
    throw error;
  }

  const queue = await Queue.findOne({ _id: token.queueId, managerId });
  if (!queue) {
    const error = new Error('Queue not found or unauthorized');
    error.statusCode = 403;
    throw error;
  }

  if (token.status === 'COMPLETED' || token.status === 'CANCELLED') {
    const error = new Error(`Cannot cancel a token that is already ${token.status}`);
    error.statusCode = 400;
    throw error;
  }

  const prevStatus = token.status;
  const prevPosition = token.position;

  token.status = 'CANCELLED';
  token.cancelledAt = new Date();
  token.cancellationReason = reason;
  token.position = null;
  await token.save();

  // If token was waiting, recompact positions
  let waitingCount = 0;
  if (prevStatus === 'WAITING') {
    waitingCount = await recompactPositions(token.queueId);
  } else {
    waitingCount = await Token.countDocuments({ queueId: token.queueId, status: 'WAITING' });
  }

  // Record queue event
  await QueueEvent.create({
    queueId: token.queueId,
    tokenId: token._id,
    eventType: 'TOKEN_CANCELLED',
    previousPosition: prevPosition,
    newPosition: null,
    waitingCount,
    timestamp: new Date(),
    metadata: {
      tokenNumber: token.tokenNumber,
      customerName: token.customerName,
      reason,
    },
  });

  // Broadcast event
  emitToQueue(token.queueId, managerId, 'queue:token_cancelled', {
    queueId: token.queueId,
    token,
    waitingCount,
  });

  return token;
};

module.exports = {
  formatTokenNumber,
  recompactPositions,
  addTokenToQueue,
  moveToken,
  serveNextToken,
  completeService,
  cancelToken,
};
