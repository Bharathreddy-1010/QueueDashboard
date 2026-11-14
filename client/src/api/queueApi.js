import api from './client';

export const queueApi = {
  getQueues: async () => {
    const res = await api.get('/queues');
    return res.data;
  },
  createQueue: async (data) => {
    const res = await api.post('/queues', data);
    return res.data;
  },
  getQueueById: async (id) => {
    const res = await api.get(`/queues/${id}`);
    return res.data;
  },
  updateQueue: async (id, data) => {
    const res = await api.patch(`/queues/${id}`, data);
    return res.data;
  },
  deleteQueue: async (id) => {
    const res = await api.delete(`/queues/${id}`);
    return res.data;
  },
};
