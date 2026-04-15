const Message = require('../models/Message');
const Booking = require('../models/Booking');
const ExpertProfile = require('../models/ExpertProfile');

// @route  GET /messages/:bookingId
// @access Private — only the client or expert of that booking
const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Verify booking exists and user is part of it
    const booking = await Booking.findById(bookingId).populate('expertId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const expertProfile = await ExpertProfile.findById(booking.expertId);
    const isClient = booking.userId.toString() === req.user._id.toString();
    const isExpert = expertProfile?.userId.toString() === req.user._id.toString();

    if (!isClient && !isExpert) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  POST /messages
// @access Private
const postMessage = async (req, res) => {
  try {
    const { bookingId, text } = req.body;
    if (!bookingId || !text?.trim()) {
      return res.status(400).json({ message: 'bookingId and text are required' });
    }

    const booking = await Booking.findById(bookingId).populate('expertId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const expertProfile = await ExpertProfile.findById(booking.expertId);
    const isClient = booking.userId.toString() === req.user._id.toString();
    const isExpert = expertProfile?.userId.toString() === req.user._id.toString();

    if (!isClient && !isExpert) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await Message.create({
      bookingId,
      senderId: req.user._id,
      senderName: req.user.name,
      text: text.trim(),
    });

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMessages, postMessage };
