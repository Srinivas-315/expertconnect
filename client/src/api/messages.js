import api from './axios';

export const getChatHistory = (bookingId) => api.get(`/messages/${bookingId}`);
export const sendMessage = (data) => api.post('/messages', data);

