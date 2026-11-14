const mongoose = require('mongoose');

const queueEventSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: true,
      index: true,
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'TOKEN_ADDED',
        'TOKEN_MOVED',
        'TOKEN_CALLED',
        'TOKEN_COMPLETED',
        'TOKEN_CANCELLED',
        'QUEUE_ACTIVATED',
        'QUEUE_DEACTIVATED',
      ],
      required: true,
      index: true,
    },
    previousPosition: {
      type: Number,
      default: null,
    },
    newPosition: {
      type: Number,
      default: null,
    },
    waitingCount: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

queueEventSchema.index({ queueId: 1, timestamp: -1 });

const QueueEvent = mongoose.model('QueueEvent', queueEventSchema);
module.exports = QueueEvent;
