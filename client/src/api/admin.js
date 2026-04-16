import api from './axios';

// Stats
export const getAdminStats    = ()           => api.get('/admin/stats');

// Users
export const getAdminUsers    = ()           => api.get('/admin/users');
export const banUser          = (id)         => api.patch(`/admin/users/${id}/ban`);

// Experts
export const getAdminExperts  = ()           => api.get('/admin/experts');
export const approveExpert    = (id)         => api.patch(`/admin/experts/${id}/approve`);
export const rejectExpert     = (id, reason) => api.patch(`/admin/experts/${id}/reject`, { reason });

// Bookings
export const getAdminBookings = ()           => api.get('/admin/bookings');

// Email test
export const sendTestEmail    = (email)      => api.post('/admin/test-email', { email });
