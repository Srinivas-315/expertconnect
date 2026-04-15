const express = require('express');
const router = express.Router();
const {
  requestBooking,
  getMyBookings,
  getExpertBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// POST /booking/request   — Private
router.post('/request', protect, requestBooking);

// GET  /booking/my        — Private (client sees their own bookings)
router.get('/my', protect, getMyBookings);

// GET  /booking/expert-requests — Private (expert sees incoming bookings)
router.get('/expert-requests', protect, getExpertBookings);

// PATCH /booking/:id/status — Private (expert confirms/cancels)
router.patch('/:id/status', protect, updateBookingStatus);

module.exports = router;
