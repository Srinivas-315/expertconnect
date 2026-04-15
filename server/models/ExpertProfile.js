const mongoose = require('mongoose');

const expertProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      required: [true, 'Skills are required'],
    },
    experience: {
      type: Number, // years
      required: [true, 'Experience is required'],
      min: 0,
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      maxlength: 1000,
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    photoUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExpertProfile', expertProfileSchema);
