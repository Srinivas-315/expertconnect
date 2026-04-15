const Booking = require('../models/Booking');
const ExpertProfile = require('../models/ExpertProfile');
const { notifyUser } = require('../socket');

// @route  POST /booking/request
// @access Private
const requestBooking = async (req, res) => {
  try {
    const { expertId, message, scheduledAt } = req.body;

    if (!expertId || !message) {
      return res.status(400).json({ message: 'expertId and message are required' });
    }

    const expert = await ExpertProfile.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    if (expert.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot book yourself' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      expertId,
      message,
      scheduledAt: scheduledAt || null,
    });

    await booking.populate([
      { path: 'userId', select: 'name email' },
      { path: 'expertId', populate: { path: 'userId', select: 'name email' } },
    ]);

    // 🔔 Notify the expert of new booking request
    notifyUser(expert.userId, 'notification', {
      type: 'new_booking',
      title: 'New Booking Request 📅',
      message: `${req.user.name} wants to book a session with you`,
      link: '/dashboard',
    });

    res.status(201).json({ message: 'Booking request sent successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /booking/my
// @access Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate({
        path: 'expertId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json({ count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /booking/expert-requests
// @access Private (expert)
const getExpertBookings = async (req, res) => {
  try {
    const profile = await ExpertProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'Expert profile not found. Please create one first.' });
    }

    const bookings = await Booking.find({ expertId: profile._id })
      .populate('userId', 'name email')
      .populate('expertId')
      .sort({ createdAt: -1 });

    res.json({ count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  PATCH /booking/:id/status
// @access Private (expert)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'expertId', populate: { path: 'userId', select: 'name' } })
      .populate('userId', 'name');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.expertId.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    // 🔔 Notify the client about booking status update
    const expertName = booking.expertId.userId.name;
    const isConfirmed = status === 'confirmed';

    notifyUser(booking.userId._id, 'notification', {
      type: 'booking_status',
      title: isConfirmed ? 'Booking Confirmed ✅' : 'Booking Declined ❌',
      message: isConfirmed
        ? `${expertName} confirmed your booking! You can now open the chat.`
        : `${expertName} declined your booking request.`,
      link: '/dashboard',
    });

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { requestBooking, getMyBookings, getExpertBookings, updateBookingStatus };
