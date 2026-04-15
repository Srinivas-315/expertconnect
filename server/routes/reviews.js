const express = require('express');
const router = express.Router();
const { submitReview, getExpertReviews, checkReviewExists } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// POST /reviews              — Submit a review (private)
router.post('/', protect, submitReview);

// GET  /reviews/expert/:id   — Get all reviews for an expert (public)
router.get('/expert/:expertId', getExpertReviews);

// GET  /reviews/booking/:id/exists — Check if booking already reviewed (private)
router.get('/booking/:bookingId/exists', protect, checkReviewExists);

module.exports = router;
