import api from './axios';

export const requestBooking = (data) => api.post('/booking/request', data);
export const getMyBookings = () => api.get('/booking/my');
export const getExpertBookings = () => api.get('/booking/expert-requests');
export const updateBookingStatus = (id, status) =>
  api.patch(`/booking/${id}/status`, { status });
