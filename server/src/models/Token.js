const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: true,
      index: true,
    },
    tokenNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['WAITING', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'],
      default: 'WAITING',
      index: true,
    },
    position: {
      type: Number,
      default: null,
      index: true,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Unique tokenNumber per queue
tokenSchema.index({ queueId: 1, tokenNumber: 1 }, { unique: true });
tokenSchema.index({ queueId: 1, status: 1, position: 1 });
tokenSchema.index({ queueId: 1, createdAt: -1 });

// Virtuals for waiting time and service duration in seconds
tokenSchema.virtual('waitingTimeSeconds').get(function () {
  if (this.calledAt && this.createdAt) {
    return Math.max(0, Math.round((this.calledAt.getTime() - this.createdAt.getTime()) / 1000));
  }
  if (this.status === 'WAITING' && this.createdAt) {
    return Math.max(0, Math.round((Date.now() - this.createdAt.getTime()) / 1000));
  }
  return null;
});

tokenSchema.virtual('serviceDurationSeconds').get(function () {
  if (this.completedAt && this.calledAt) {
    return Math.max(0, Math.round((this.completedAt.getTime() - this.calledAt.getTime()) / 1000));
  }
  if (this.status === 'IN_SERVICE' && this.calledAt) {
    return Math.max(0, Math.round((Date.now() - this.calledAt.getTime()) / 1000));
  }
  return null;
});

tokenSchema.set('toJSON', { virtuals: true });
tokenSchema.set('toObject', { virtuals: true });

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
