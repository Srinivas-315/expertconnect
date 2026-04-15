const express = require('express');
const router = express.Router();
const {
  createProfile,
  getAllExperts,
  getExpertById,
  updateProfile,
  getRecommendedExperts,
} = require('../controllers/expertController');
const { protect, authorizeRole } = require('../middleware/auth');

// GET  /experts        — Public
router.get('/', getAllExperts);

// GET  /experts/recommended — Private (must be before /:id)
router.get('/recommended', protect, getRecommendedExperts);

// GET  /experts/:id    — Public
router.get('/:id', getExpertById);

// POST /experts/create — Private (expert only)
router.post('/create', protect, authorizeRole('expert'), createProfile);

// PUT  /experts/:id    — Private (own profile)
router.put('/:id', protect, authorizeRole('expert'), updateProfile);

module.exports = router;
