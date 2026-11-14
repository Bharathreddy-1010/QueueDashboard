const mongoose = require('mongoose');
const AIConversation = require('../models/AIConversation');

const MAX_SAVED_MESSAGES = 30;

/**
 * Get or create an AI conversation for the authenticated manager
 */
const getOrCreateConversation = async ({ conversationId, managerId, title, queueId }) => {
  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    const existing = await AIConversation.findOne({ _id: conversationId, managerId });
    if (existing) {
      if (queueId && !existing.queueId) {
        existing.queueId = queueId;
        await existing.save();
      }
      return existing;
    }
  }

  // Create new conversation
  const newConversation = await AIConversation.create({
    managerId,
    title: title || 'Queue Operations Chat',
    queueId: queueId && mongoose.Types.ObjectId.isValid(queueId) ? queueId : null,
    messages: [],
    lastActiveAt: new Date(),
  });

  return newConversation;
};

/**
 * Append a message to the conversation with retention pruning
 */
const appendMessage = async (conversationId, message) => {
  const conversation = await AIConversation.findById(conversationId);
  if (!conversation) return null;

  conversation.messages.push(message);

  // If conversation has a default title and this is a user message, update title
  if (conversation.title === 'New Conversation' || conversation.title === 'Queue Operations Chat') {
    if (message.role === 'user' && message.content) {
      conversation.title = message.content.slice(0, 45).trim() + (message.content.length > 45 ? '...' : '');
    }
  }

  // Keep last MAX_SAVED_MESSAGES
  if (conversation.messages.length > MAX_SAVED_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_SAVED_MESSAGES);
  }

  conversation.lastActiveAt = new Date();
  await conversation.save();
  return conversation;
};

/**
 * Retrieve formatted history for sending to Groq
 */
const getFormattedHistory = async (conversationId, maxCount = 10) => {
  const conversation = await AIConversation.findById(conversationId);
  if (!conversation || !conversation.messages) return [];

  // Take recent messages
  const recent = conversation.messages.slice(-maxCount);

  return recent.map((m) => {
    const formatted = {
      role: m.role,
      content: m.content || '',
    };
    if (m.toolCalls && m.toolCalls.length > 0) {
      formatted.tool_calls = m.toolCalls;
    }
    if (m.toolCallId) {
      formatted.tool_call_id = m.toolCallId;
    }
    if (m.name) {
      formatted.name = m.name;
    }
    return formatted;
  });
};

/**
 * Delete a manager's conversation
 */
const deleteConversation = async (conversationId, managerId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return false;
  }
  const result = await AIConversation.findOneAndDelete({ _id: conversationId, managerId });
  return Boolean(result);
};

/**
 * List recent conversations for a manager
 */
const listConversations = async (managerId, limit = 10) => {
  return await AIConversation.find({ managerId })
    .sort({ lastActiveAt: -1 })
    .limit(limit)
    .select('_id title queueId lastActiveAt createdAt')
    .lean();
};

module.exports = {
  getOrCreateConversation,
  appendMessage,
  getFormattedHistory,
  deleteConversation,
  listConversations,
};
