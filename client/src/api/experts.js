import api from './axios';

export const getExperts = (params) => api.get('/experts', { params });
export const getExpertById = (id) => api.get(`/experts/${id}`);
export const createExpertProfile = (data) => api.post('/experts/create', data);
export const updateExpertProfile = (id, data) => api.put(`/experts/${id}`, data);
export const getRecommendedExperts = () => api.get('/experts/recommended');
export const uploadExpertPhoto = (id, formData) =>
  api.post(`/experts/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

