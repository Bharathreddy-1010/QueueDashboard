import api from './client';

export const analyticsApi = {
  getOverview: async (params = {}) => {
    const res = await api.get('/analytics/overview', { params });
    return res.data;
  },
  getQueueAnalytics: async (queueId, params = {}) => {
    const res = await api.get(`/queues/${queueId}/analytics`, { params });
    return res.data;
  },
};
