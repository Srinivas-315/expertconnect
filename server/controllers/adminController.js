const User = require('../models/User');
const ExpertProfile = require('../models/ExpertProfile');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/emailService');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────
// @route  GET /admin/stats
// @access Admin
// ─────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalExperts, totalBookings, pendingExperts, bannedUsers] = await Promise.all([
      User.countDocuments(),
      ExpertProfile.countDocuments(),
      Booking.countDocuments(),
      ExpertProfile.countDocuments({ isApproved: false, isRejected: false }),
      User.countDocuments({ isBanned: true }),
    ]);

    // Revenue estimate: count confirmed bookings (no actual payment stored per booking)
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

    // Bookings by status
    const [pendingBookings, cancelledBookings] = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      totalUsers,
      totalExperts,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      pendingExperts,
      bannedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  GET /admin/users
// @access Admin
// ─────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  PATCH /admin/users/:id/ban
// @access Admin
// ─────────────────────────────────────────────────────────
const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent banning another admin
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin account' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  GET /admin/experts
// @access Admin
// ─────────────────────────────────────────────────────────
const getAllExpertProfiles = async (req, res) => {
  try {
    const experts = await ExpertProfile.find()
      .populate('userId', 'name email isBanned')
      .sort({ isApproved: 1, createdAt: -1 }); // pending first
    res.json({ count: experts.length, experts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  PATCH /admin/experts/:id/approve
// @access Admin
// ─────────────────────────────────────────────────────────
const approveExpert = async (req, res) => {
  try {
    const profile = await ExpertProfile.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isRejected: false, rejectionReason: '' },
      { new: true }
    ).populate('userId', 'name email');

    if (!profile) return res.status(404).json({ message: 'Expert profile not found' });

    res.json({ message: 'Expert profile approved', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  PATCH /admin/experts/:id/reject
// @access Admin
// ─────────────────────────────────────────────────────────
const rejectExpert = async (req, res) => {
  try {
    const { reason } = req.body;
    const profile = await ExpertProfile.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        isRejected: true,
        rejectionReason: reason || 'Does not meet platform requirements',
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!profile) return res.status(404).json({ message: 'Expert profile not found' });

    res.json({ message: 'Expert profile rejected', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  GET /admin/bookings
// @access Admin
// ─────────────────────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
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

// ─────────────────────────────────────────────────────────
// @route  POST /admin/test-email
// @access Admin
// Send a test email to verify Resend is working correctly
// ─────────────────────────────────────────────────────────
const testEmail = async (req, res) => {
  try {
    const toEmail = req.body.email || req.user.email;

    const result = await resend.emails.send({
      from: 'ExpertConnect <onboarding@resend.dev>',
      to: toEmail,
      subject: '✅ ExpertConnect — Email System Test',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:40px 0;margin:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#2563EB,#4F46E5);padding:32px 40px;text-align:center;">
                    <span style="color:#fff;font-size:22px;font-weight:800;">EC ExpertConnect</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h1 style="color:#1e293b;font-size:24px;margin:0 0 16px;">📧 Email System Working! ✅</h1>
                    <p style="color:#475569;font-size:15px;line-height:1.6;">
                      This is a test email sent from your <strong>ExpertConnect Admin Panel</strong>.
                    </p>
                    <p style="color:#475569;font-size:15px;line-height:1.6;">
                      ✅ <strong>Resend API</strong> is connected<br/>
                      ✅ <strong>Email templates</strong> are working<br/>
                      ✅ <strong>Booking notifications</strong> will be sent automatically
                    </p>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:24px 0;">
                      <p style="color:#166534;margin:0;font-size:14px;">
                        💡 If this email landed in spam, add <code>onboarding@resend.dev</code> to your contacts or verify a custom domain in Resend dashboard.
                      </p>
                    </div>
                    <p style="color:#94a3b8;font-size:13px;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="color:#94a3b8;font-size:13px;margin:0;">© ${new Date().getFullYear()} ExpertConnect Admin Panel</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    res.json({
      message: '✅ Test email sent successfully!',
      to: toEmail,
      id: result?.data?.id || result?.id,
      note: 'Check your inbox (and spam folder). If using Resend test domain, only verified email addresses receive emails.',
    });
  } catch (error) {
    res.status(500).json({
      message: '❌ Email send failed',
      error: error.message,
      hint: 'Check RESEND_API_KEY in your .env file',
    });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  toggleBanUser,
  getAllExpertProfiles,
  approveExpert,
  rejectExpert,
  getAllBookings,
  testEmail,
};
