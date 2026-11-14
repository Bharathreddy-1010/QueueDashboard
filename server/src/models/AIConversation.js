const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: null,
    },
    toolCalls: {
      type: Array,
      default: null,
    },
    toolCallId: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      maxlength: 120,
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      default: null,
    },
    messages: [messageSchema],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: conversations automatically expire after 7 days of inactivity
aiConversationSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
// Composite index for fast manager lookup
aiConversationSchema.index({ managerId: 1, lastActiveAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = AIConversation;
