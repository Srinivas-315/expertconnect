import api from './axios';

export const submitReview = (data) => api.post('/reviews', data);
export const getExpertReviews = (expertId) => api.get(`/reviews/expert/${expertId}`);
export const checkReviewExists = (bookingId) => api.get(`/reviews/booking/${bookingId}/exists`);
