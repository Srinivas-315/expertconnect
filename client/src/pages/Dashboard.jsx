import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, getExpertBookings, updateBookingStatus } from '../api/bookings';
import { createExpertProfile } from '../api/experts';
import { submitReview, checkReviewExists } from '../api/reviews';
import { Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';

const STATUS_COLORS = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50  text-green-700  border-green-200',
  cancelled: 'bg-red-50    text-red-700    border-red-200',
};
const STATUS_ICON = { pending: '⏳', confirmed: '✅', cancelled: '❌' };

// ── Review Modal Component ─────────────────────────────────
const ReviewModal = ({ expertName, onSubmit, onClose, loading }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent! 🎉'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rate Your Session</h2>
            <p className="text-sm text-gray-500">with <span className="font-semibold text-blue-600">{expertName}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Stars */}
        <div className="text-center py-4 bg-gray-50 rounded-xl mb-4">
          <p className="text-sm text-gray-500 mb-3">Tap a star to rate</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <p className="text-sm font-semibold text-blue-600 mt-2">{LABELS[rating]}</p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Review <span className="text-gray-400">(required)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="How was your experience? Was the expert helpful, professional, and knowledgeable?"
            className="input-field resize-none text-sm"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
          💡 Your review will be <strong>publicly visible</strong> on the expert's profile — helping other clients decide.
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onSubmit(rating, comment)}
            disabled={loading || rating === 0 || comment.trim().length < 10}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {loading ? '⏳ Submitting...' : '⭐ Submit Review'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
        {comment.trim().length > 0 && comment.trim().length < 10 && (
          <p className="text-xs text-red-500 text-center mt-2">Review must be at least 10 characters</p>
        )}
      </div>

      <style>{`
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isExpert = user?.role === 'expert';

  const [tab, setTab] = useState(isExpert ? 'received' : 'sent');

  // Client bookings
  const [sentBookings, setSentBookings] = useState([]);
  const [sentLoading, setSentLoading] = useState(true);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());

  // Expert bookings
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Expert profile form
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({ skills: '', experience: '', bio: '', hourlyRate: '', category: 'Technology' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Review modal
  const [reviewModal, setReviewModal] = useState(null); // { bookingId, expertName }
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Fetch client bookings + check which ones are already reviewed
  useEffect(() => {
    getMyBookings()
      .then(async (res) => {
        const bookings = res.data.bookings;
        setSentBookings(bookings);

        const confirmed = bookings.filter((b) => b.status === 'confirmed');
        if (confirmed.length > 0) {
          try {
            const checks = await Promise.all(confirmed.map((b) => checkReviewExists(b._id)));
            const reviewed = new Set();
            checks.forEach((r, i) => {
              if (r.data.reviewed) reviewed.add(confirmed[i]._id);
            });
            setReviewedBookings(reviewed);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setSentLoading(false));
  }, []);

  // Fetch expert bookings
  useEffect(() => {
    if (!isExpert) return;
    setReceivedLoading(true);
    getExpertBookings()
      .then((res) => setReceivedBookings(res.data.bookings))
      .catch(() => {})
      .finally(() => setReceivedLoading(false));
  }, [isExpert]);

  // Expert: Confirm / Cancel booking
  const handleStatusUpdate = async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      setReceivedBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status } : b)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  // Submit review
  const handleReviewSubmit = async (rating, comment) => {
    if (rating === 0) return alert('Please select a rating');
    if (comment.trim().length < 10) return alert('Review must be at least 10 characters');
    setReviewLoading(true);
    try {
      await submitReview({ bookingId: reviewModal.bookingId, rating, comment });
      setReviewedBookings((prev) => new Set([...prev, reviewModal.bookingId]));
      setReviewSuccess(reviewModal.expertName);
      setReviewModal(null);
      setTimeout(() => setReviewSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review. Try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Expert: Create profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await createExpertProfile({
        ...profileForm,
        skills: profileForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        experience: Number(profileForm.experience),
        hourlyRate: Number(profileForm.hourlyRate),
      });
      setProfileMsg('success');
      setShowProfileForm(false);
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Review Success Banner ──────────────────────────── */}
      {reviewSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800">Review submitted!</p>
            <p className="text-sm text-green-600">
              Your review for <strong>{reviewSuccess}</strong> is now live on their public profile.
              Other clients can see it when deciding to hire.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome, <span className="font-semibold text-gray-700">{user?.name}</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
        </p>
      </div>

      {/* ── Expert: Create Profile ─────────────────────────── */}
      {isExpert && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Expert Profile</h2>
            <button onClick={() => setShowProfileForm(!showProfileForm)} className="btn-secondary text-sm">
              {showProfileForm ? 'Cancel' : '+ Create / Update Profile'}
            </button>
          </div>
          {profileMsg === 'success' && (
            <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              ✅ Profile created! Clients can now find and book you.
            </div>
          )}
          {profileMsg && profileMsg !== 'success' && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">❌ {profileMsg}</div>
          )}
          {showProfileForm && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills <span className="text-gray-400">(comma-separated)</span></label>
                  <input type="text" value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} required placeholder="React, Node.js, MongoDB" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={profileForm.category} onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })} className="input-field">
                    {['Technology','Finance','Legal','Healthcare','Marketing','Design','General'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input type="number" value={profileForm.experience} onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
                  <input type="number" value={profileForm.hourlyRate} onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })} required min="0" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} required rows={3} maxLength={1000} placeholder="Tell clients about your expertise..." className="input-field resize-none" />
              </div>
              <button type="submit" disabled={profileLoading} className="btn-primary">{profileLoading ? 'Creating...' : 'Create Profile'}</button>
            </form>
          )}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button onClick={() => setTab('sent')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          📤 My Bookings
          {sentBookings.length > 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{sentBookings.length}</span>}
        </button>
        {isExpert && (
          <button onClick={() => setTab('received')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            📥 Incoming Requests
            {receivedBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{receivedBookings.filter(b => b.status === 'pending').length} new</span>
            )}
          </button>
        )}
      </div>

      {/* ── Tab: My Bookings (Client) ──────────────────────── */}
      {tab === 'sent' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-gray-900">Sessions I Booked</h2>
            <Link to="/experts" className="text-sm text-blue-600 hover:underline">Find more experts →</Link>
          </div>

          {sentLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : sentBookings.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <h3 className="font-semibold text-gray-900">No bookings yet</h3>
              <p className="text-gray-500 text-sm mt-1">Find an expert and book your first session</p>
              <Link to="/experts" className="mt-4 inline-block btn-primary text-sm">Browse Experts</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sentBookings.map((booking) => {
                const expertName = booking.expertId?.userId?.name || 'Unknown Expert';
                const isConfirmed = booking.status === 'confirmed';
                const alreadyReviewed = reviewedBookings.has(booking._id);

                return (
                  <div key={booking._id} className="card">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Left: Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {expertName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{expertName}</p>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{booking.message}</p>
                          {booking.scheduledAt && (
                            <p className="text-xs text-gray-400 mt-1">📅 {new Date(booking.scheduledAt).toLocaleString()}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Requested on {new Date(booking.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Right: Status + Actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize whitespace-nowrap flex items-center gap-1 ${STATUS_COLORS[booking.status]}`}>
                          {STATUS_ICON[booking.status]} {booking.status}
                        </span>

                        {isConfirmed && (
                          <>
                            <button
                              onClick={() => navigate(`/chat/${booking._id}`)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                            >
                              💬 Open Chat
                            </button>

                            {alreadyReviewed ? (
                              <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                ✅ Reviewed
                              </span>
                            ) : (
                              <button
                                onClick={() => setReviewModal({ bookingId: booking._id, expertName })}
                                className="text-xs bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap"
                              >
                                ⭐ Leave Review
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Explain what review does — show only if confirmed & not reviewed */}
                    {isConfirmed && !alreadyReviewed && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-start gap-1.5">
                        <span>💡</span>
                        <span>Your <strong className="text-gray-700">⭐ Leave Review</strong> will be publicly shown on the expert's profile — helping other clients decide.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Incoming Requests (Expert) ────────────────── */}
      {tab === 'received' && isExpert && (
        <div>
          <h2 className="font-semibold text-lg text-gray-900 mb-4">Client Booking Requests</h2>
          {receivedLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : receivedBookings.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📬</div>
              <h3 className="font-semibold text-gray-900">No booking requests yet</h3>
              <p className="text-gray-500 text-sm mt-1">Create your expert profile so clients can find and book you</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedBookings.map((booking) => {
                const clientName = booking.userId?.name || 'Unknown Client';
                const clientEmail = booking.userId?.email || '';
                const isPending = booking.status === 'pending';
                return (
                  <div key={booking._id} className={`card border-l-4 ${isPending ? 'border-l-yellow-400' : booking.status === 'confirmed' ? 'border-l-green-400' : 'border-l-red-400'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {clientName[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{clientName}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[booking.status]}`}>
                              {STATUS_ICON[booking.status]} {booking.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{clientEmail}</p>
                          <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400 font-medium mb-1">📩 Message:</p>
                            <p className="text-sm text-gray-700">{booking.message}</p>
                          </div>
                          {booking.scheduledAt && (
                            <p className="text-xs text-blue-600 mt-2 font-medium">📅 Requested: {new Date(booking.scheduledAt).toLocaleString()}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Received: {new Date(booking.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {isPending && (
                          <>
                            <button onClick={() => handleStatusUpdate(booking._id, 'confirmed')} disabled={updatingId === booking._id} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                              {updatingId === booking._id ? '...' : '✅ Confirm'}
                            </button>
                            <button onClick={() => handleStatusUpdate(booking._id, 'cancelled')} disabled={updatingId === booking._id} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                              {updatingId === booking._id ? '...' : '❌ Decline'}
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button onClick={() => navigate(`/chat/${booking._id}`)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                            💬 Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Review Modal ───────────────────────────────────── */}
      {reviewModal && (
        <ReviewModal
          expertName={reviewModal.expertName}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewModal(null)}
          loading={reviewLoading}
        />
      )}
    </div>
  );
};

export default Dashboard;
