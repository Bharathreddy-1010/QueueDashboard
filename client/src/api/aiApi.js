import api from './client';

export const aiApi = {
  /**
   * Send a question to QueuePro AI Copilot
   */
  sendMessage: async ({ message, conversationId = null, queueId = null }) => {
    const response = await api.post('/ai/chat', {
      message,
      conversationId,
      queueId,
    });
    return response.data;
  },

  /**
   * Retrieve a specific conversation by ID
   */
  getConversation: async (id) => {
    const response = await api.get(`/ai/conversations/${id}`);
    return response.data;
  },

  /**
   * List recent conversations for authenticated manager
   */
  listConversations: async () => {
    const response = await api.get('/ai/conversations');
    return response.data;
  },

  /**
   * Clear / delete a conversation
   */
  clearConversation: async (id) => {
    const response = await api.delete(`/ai/conversations/${id}`);
    return response.data;
  },
};
