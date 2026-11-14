const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Queue name is required'],
      trim: true,
      maxlength: [120, 'Queue name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    nextTokenNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    prefix: {
      type: String,
      default: 'T',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
queueSchema.index({ managerId: 1, createdAt: -1 });

const Queue = mongoose.model('Queue', queueSchema);
module.exports = Queue;
