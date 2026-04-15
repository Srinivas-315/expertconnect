const ExpertProfile = require('../models/ExpertProfile');
const Booking = require('../models/Booking');

// @route  POST /experts/create
// @access Private (expert role)
const createProfile = async (req, res) => {
  try {
    const { skills, experience, bio, hourlyRate, category } = req.body;

    // Check if profile already exists for this user
    const existing = await ExpertProfile.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'Expert profile already exists for this user' });
    }

    const profile = await ExpertProfile.create({
      userId: req.user._id,
      skills,
      experience,
      bio,
      hourlyRate,
      category: category || 'General',
    });

    // Populate user info
    await profile.populate('userId', 'name email');

    res.status(201).json({ message: 'Expert profile created', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /experts
// @access Public
const getAllExperts = async (req, res) => {
  try {
    const { search, category, minRate, maxRate } = req.query;

    let filter = { available: true };

    if (category) filter.category = category;
    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = Number(minRate);
      if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
    }

    let experts = await ExpertProfile.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Search by skill or name (post-filter)
    if (search) {
      const q = search.toLowerCase();
      experts = experts.filter(
        (e) =>
          e.skills.some((s) => s.toLowerCase().includes(q)) ||
          e.userId.name.toLowerCase().includes(q) ||
          e.bio.toLowerCase().includes(q)
      );
    }

    res.json({ count: experts.length, experts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /experts/:id
// @access Public
const getExpertById = async (req, res) => {
  try {
    const expert = await ExpertProfile.findById(req.params.id).populate(
      'userId',
      'name email'
    );

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    res.json({ expert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  PUT /experts/:id
// @access Private (own profile)
const updateProfile = async (req, res) => {
  try {
    const profile = await ExpertProfile.findOne({ _id: req.params.id, userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found or unauthorized' });
    }

    const updated = await ExpertProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email');

    res.json({ message: 'Profile updated', profile: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /experts/recommended
// @access Private
const getRecommendedExperts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Step 1: Find user's past confirmed bookings
    const pastBookings = await Booking.find({ userId, status: 'confirmed' })
      .populate('expertId');

    // Step 2: Extract categories & expertIds from past bookings
    const bookedExpertIds = new Set();
    const categoryCounts = {};

    pastBookings.forEach((b) => {
      if (b.expertId) {
        bookedExpertIds.add(b.expertId._id.toString());
        const cat = b.expertId.category;
        if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    // Step 3: Fetch all available experts
    const allExperts = await ExpertProfile.find({ available: true })
      .populate('userId', 'name email');

    // Step 4: Score each expert
    const scored = allExperts
      .filter((e) => {
        // Exclude the user's own profile
        if (e.userId._id.toString() === userId.toString()) return false;
        // Exclude already booked experts (if they want fresh recommendations)
        // Keep booked ones but score them lower — user may want to re-book
        return true;
      })
      .map((expert) => {
        let score = 0;

        // Category match score — more bookings in same category = higher score
        const catScore = categoryCounts[expert.category] || 0;
        score += catScore * 3;  // Weight: category match x3

        // Rating boost — higher rated experts get +rating points
        score += (expert.avgRating || 0) * 2;  // Weight: rating x2

        // Availability bonus
        score += expert.available ? 1 : 0;

        // Experience bonus (small)
        score += Math.min(expert.experience / 10, 1); // max +1 for experience

        // Penalty if already booked (gentle push toward new experts)
        if (bookedExpertIds.has(expert._id.toString())) score -= 1;

        return { expert, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6) // Return top 6
      .map((item) => item.expert);

    // Step 5: Fallback — if no history or not enough results, fill with top-rated
    let recommendations = scored;
    if (recommendations.length < 3) {
      const topRated = await ExpertProfile.find({ available: true })
        .populate('userId', 'name email')
        .sort({ avgRating: -1, totalReviews: -1 })
        .limit(6);
      // Merge without duplicates
      const ids = new Set(recommendations.map((e) => e._id.toString()));
      const extras = topRated.filter((e) => !ids.has(e._id.toString()));
      recommendations = [...recommendations, ...extras].slice(0, 6);
    }

    const hasHistory = Object.keys(categoryCounts).length > 0;
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 3);

    res.json({
      recommendations,
      basedOn: hasHistory ? topCategories : null,
      count: recommendations.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  POST /experts/:id/photo
// @access Private (own profile)
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const profile = await ExpertProfile.findOne({ _id: req.params.id, userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found or unauthorized' });
    }

    // req.file.path is the Cloudinary URL after upload
    profile.photoUrl = req.file.path;
    await profile.save();

    res.json({ message: 'Photo uploaded successfully', photoUrl: profile.photoUrl });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

module.exports = { createProfile, getAllExperts, getExpertById, updateProfile, getRecommendedExperts, uploadPhoto };

