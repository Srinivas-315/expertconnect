import api from './axios';

export const getChatHistory = (bookingId) => api.get(`/messages/${bookingId}`);
