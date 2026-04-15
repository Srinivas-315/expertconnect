const express = require('express');
const router = express.Router();
const {
  createProfile,
  getAllExperts,
  getExpertById,
  updateProfile,
  getRecommendedExperts,
  uploadPhoto,
} = require('../controllers/expertController');
const { protect, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// POST /experts/:id/photo — Private (upload profile photo)
router.post('/:id/photo', protect, authorizeRole('expert'), upload.single('photo'), uploadPhoto);

module.exports = router;
