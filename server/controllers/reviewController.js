const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ExpertProfile = require('../models/ExpertProfile');

// Helper: recalculate expert avg rating and save
const updateExpertRating = async (expertId) => {
  const reviews = await Review.find({ expertId });
  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 0;
  await ExpertProfile.findByIdAndUpdate(expertId, { avgRating, totalReviews });
};

// @route  POST /reviews
// @access Private (user only)
const submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ message: 'bookingId, rating, and comment are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check booking exists and belongs to this user
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'You can only review confirmed bookings' });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this booking' });
    }

    const review = await Review.create({
      userId: req.user._id,
      expertId: booking.expertId,
      bookingId,
      rating,
      comment,
    });

    await review.populate('userId', 'name');

    // Update expert's avgRating + totalReviews
    await updateExpertRating(booking.expertId);

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this booking' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /reviews/expert/:expertId
// @access Public
const getExpertReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ expertId: req.params.expertId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const avgRating = totalReviews
      ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    res.json({ avgRating, totalReviews, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /reviews/booking/:bookingId/exists
// @access Private
const checkReviewExists = async (req, res) => {
  try {
    const review = await Review.findOne({ bookingId: req.params.bookingId });
    res.json({ reviewed: !!review, review: review || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { submitReview, getExpertReviews, checkReviewExists };
