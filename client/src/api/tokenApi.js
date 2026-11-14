import api from './client';

export const tokenApi = {
  getTokens: async (queueId, params = {}) => {
    const res = await api.get(`/queues/${queueId}/tokens`, { params });
    return res.data;
  },
  addToken: async (queueId, data) => {
    const res = await api.post(`/queues/${queueId}/tokens`, data);
    return res.data;
  },
  moveToken: async (tokenId, data) => {
    const res = await api.patch(`/tokens/${tokenId}/move`, data);
    return res.data;
  },
  serveNext: async (queueId) => {
    const res = await api.post(`/queues/${queueId}/serve-next`);
    return res.data;
  },
  completeToken: async (tokenId) => {
    const res = await api.post(`/tokens/${tokenId}/complete`);
    return res.data;
  },
  cancelToken: async (tokenId, data = {}) => {
    const res = await api.post(`/tokens/${tokenId}/cancel`, data);
    return res.data;
  },
};
