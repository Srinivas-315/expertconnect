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

module.exports = { getMessages };
