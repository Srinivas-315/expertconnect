const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpertProfile',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    scheduledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
