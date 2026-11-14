const { chatRequestSchema, conversationIdParamSchema } = require('../validators/ai.validator');
const aiConversationService = require('../services/ai-conversation.service');
const groqService = require('../services/groq.service');

/**
 * POST /api/ai/chat
 * Primary entry point for AI copilot queries
 */
const chat = async (req, res, next) => {
  try {
    const validatedData = chatRequestSchema.parse(req.body);
    const { message, conversationId, queueId } = validatedData;
    const managerId = req.user._id;

    // 1. Get or create conversation record for this manager
    const conversation = await aiConversationService.getOrCreateConversation({
      conversationId,
      managerId,
      queueId,
      title: message.slice(0, 40),
    });

    // 2. Append user message to database history
    await aiConversationService.appendMessage(conversation._id, {
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    // 3. Retrieve recent message history formatted for the model
    const history = await aiConversationService.getFormattedHistory(conversation._id, 10);

    // 4. Run chat through Groq with tool-calling capabilities
    const result = await groqService.runChat({
      messages: history,
      managerId,
      currentQueueId: queueId || (conversation.queueId ? conversation.queueId.toString() : null),
    });

    // 5. Append assistant reply to conversation history
    await aiConversationService.appendMessage(conversation._id, {
      role: 'assistant',
      content: result.reply,
      metadata: {
        toolsUsed: result.toolsUsed,
        dataRetrievedAt: result.dataRetrievedAt,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      conversationId: conversation._id.toString(),
      reply: result.reply,
      metadata: {
        dataRetrievedAt: result.dataRetrievedAt,
        toolsUsed: result.toolsUsed,
        isConfigured: result.isConfigured !== false,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid input data',
      });
    }
    next(error);
  }
};

/**
 * GET /api/ai/conversations
 * List authenticated manager's recent conversations
 */
const listConversations = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const conversations = await aiConversationService.listConversations(managerId, 15);
    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/conversations/:id
 * Retrieve a specific conversation belonging to the manager
 */
const getConversation = async (req, res, next) => {
  try {
    const { id } = conversationIdParamSchema.parse(req.params);
    const managerId = req.user._id;

    const conversation = await aiConversationService.getOrCreateConversation({
      conversationId: id,
      managerId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        queueId: conversation.queueId,
        messages: conversation.messages.map((m) => ({
          id: m._id,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          createdAt: m.createdAt,
        })),
        lastActiveAt: conversation.lastActiveAt,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid conversation ID',
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/ai/conversations/:id
 * Clear/delete a manager's conversation
 */
const deleteConversation = async (req, res, next) => {
  try {
    const { id } = conversationIdParamSchema.parse(req.params);
    const managerId = req.user._id;

    const deleted = await aiConversationService.deleteConversation(id, managerId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or already deleted',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation cleared successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid conversation ID',
      });
    }
    next(error);
  }
};

module.exports = {
  chat,
  listConversations,
  getConversation,
  deleteConversation,
};
