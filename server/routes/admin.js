const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  toggleBanUser,
  getAllExpertProfiles,
  approveExpert,
  rejectExpert,
  getAllBookings,
  testEmail,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

// ── Stats ──────────────────────────────────────────────────
router.get('/stats', getStats);

// ── Users ──────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', toggleBanUser);

// ── Experts ────────────────────────────────────────────────
router.get('/experts', getAllExpertProfiles);
router.patch('/experts/:id/approve', approveExpert);
router.patch('/experts/:id/reject', rejectExpert);

// ── Bookings ───────────────────────────────────────────────
router.get('/bookings', getAllBookings);

// ── Email Test ─────────────────────────────────────────────
router.post('/test-email', testEmail);

module.exports = router;
