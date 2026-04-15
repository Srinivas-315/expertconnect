const Booking = require('../models/Booking');
const ExpertProfile = require('../models/ExpertProfile');
const User = require('../models/User');
const { notifyUser } = require('../socket');
const {
  sendBookingConfirmation,
  sendNewBookingAlert,
  sendBookingAccepted,
  sendBookingRejected,
  sendPaymentSuccess,
  sendEmail,
} = require('../utils/emailService');

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

    // 🔔 Socket notification to expert
    notifyUser(expert.userId, 'notification', {
      type: 'new_booking',
      title: 'New Booking Request 📅',
      message: `${req.user.name} wants to book a session with you`,
      link: '/dashboard',
    });

    // 📧 Email notifications (non-blocking)
    const expertUser = await User.findById(expert.userId).select('email name');
    const emailData = {
      clientEmail: req.user.email,
      clientName: req.user.name,
      expertEmail: expertUser?.email,
      expertName: expertUser?.name || 'Expert',
      category: expert.category,
      scheduledDate: scheduledAt || new Date(),
      bookingId: booking._id,
    };

    // 📧 Send emails (awaited so Vercel doesn't kill them)
    await sendEmail(sendBookingConfirmation, emailData);
    if (expertUser?.email) {
      await sendEmail(sendNewBookingAlert, emailData);
    }

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
      .populate({ path: 'expertId', populate: { path: 'userId', select: 'name email' } })
      .populate('userId', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.expertId.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const prevStatus = booking.status;
    booking.status = status;
    await booking.save();

    const expertName = booking.expertId.userId.name;
    const clientEmail = booking.userId.email;
    const clientName = booking.userId.name;
    const isConfirmed = status === 'confirmed';
    const isRejected = status === 'rejected' || status === 'cancelled';

    // 🔔 Socket notification
    notifyUser(booking.userId._id, 'notification', {
      type: 'booking_status',
      title: isConfirmed ? 'Booking Confirmed ✅' : 'Booking Declined ❌',
      message: isConfirmed
        ? `${expertName} confirmed your booking! You can now open the chat.`
        : `${expertName} declined your booking request.`,
      link: '/dashboard',
    });

    // 📧 Email notification
    const emailBase = {
      clientEmail,
      clientName,
      expertName,
      category: booking.expertId.category,
      scheduledDate: booking.scheduledAt || booking.createdAt,
      bookingId: booking._id,
    };

    if (isConfirmed) {
      await sendEmail(sendBookingAccepted, emailBase);
    } else if (isRejected) {
      await sendEmail(sendBookingRejected, emailBase);
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  POST /booking/:id/payment-success
// @access Private
const paymentSuccess = async (req, res) => {
  try {
    const { amount, transactionId } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'expertId', populate: { path: 'userId', select: 'name' } })
      .populate('userId', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Mark as paid
    booking.paid = true;
    booking.transactionId = transactionId;
    await booking.save();

    // 📧 Payment receipt email
    sendEmail(sendPaymentSuccess, {
      clientEmail: booking.userId.email,
      clientName: booking.userId.name,
      expertName: booking.expertId.userId.name,
      amount,
      bookingId: booking._id,
      transactionId,
    });

    res.json({ message: 'Payment recorded successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { requestBooking, getMyBookings, getExpertBookings, updateBookingStatus, paymentSuccess };
