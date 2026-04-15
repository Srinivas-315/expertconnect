import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExpertById } from '../api/experts';
import { getExpertReviews } from '../api/reviews';
import BookingForm from '../components/BookingForm';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

// Single review card
const ReviewCard = ({ review }) => {
  const initials = review.userId?.name?.[0]?.toUpperCase() || '?';
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-medium text-gray-900 text-sm">{review.userId?.name}</p>
          <span className="text-xs text-gray-400">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
        <StarRating value={review.rating} size="sm" />
        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
      </div>
    </div>
  );
};

const ExpertDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [expertRes, reviewsRes] = await Promise.all([
          getExpertById(id),
          getExpertReviews(id),
        ]);
        setExpert(expertRes.data.expert);
        setReviews(reviewsRes.data.reviews);
        setAvgRating(reviewsRes.data.avgRating);
        setTotalReviews(reviewsRes.data.totalReviews);
      } catch {
        setError('Expert not found');
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="text-center py-32">
        <div className="text-5xl mb-3">😕</div>
        <h2 className="text-xl font-bold text-gray-900">{error || 'Expert not found'}</h2>
        <button onClick={() => navigate('/experts')} className="mt-4 btn-secondary">
          ← Back to Experts
        </button>
      </div>
    );
  }

  const name = expert.userId?.name || 'Expert';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← Back
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Left: Profile ─────────────────────────────── */}
        <div className="md:col-span-2 space-y-5">
          {/* Profile Header */}
          <div className="card flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{name}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{expert.category}</span>
                {expert.available ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✅ Available</span>
                ) : (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">❌ Unavailable</span>
                )}
              </div>

              {/* ⭐ Rating summary */}
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={Math.round(avgRating)} size="sm" />
                <span className="text-sm font-bold text-gray-800">
                  {avgRating > 0 ? avgRating.toFixed(1) : 'No reviews yet'}
                </span>
                {totalReviews > 0 && (
                  <span className="text-xs text-gray-400">
                    ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-1">{expert.userId?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">₹{expert.hourlyRate}</p>
              <p className="text-xs text-gray-500">per hour</p>
            </div>
          </div>

          {/* Bio */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{expert.bio}</p>
          </div>

          {/* Skills */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {expert.skills.map((skill, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-lg font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-1">Experience</h2>
            <p className="text-3xl font-bold text-blue-600">
              {expert.experience}
              <span className="text-base text-gray-500 font-normal ml-1">years</span>
            </p>
          </div>

          {/* ── Reviews Section ────────────────────────── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Reviews
                {totalReviews > 0 && (
                  <span className="ml-2 text-sm text-gray-400 font-normal">({totalReviews})</span>
                )}
              </h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating value={Math.round(avgRating)} size="sm" />
                  <span className="font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div>
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Booking ─────────────────────────── */}
        <div className="md:col-span-1">
          <div className="card sticky top-20">
            {!user ? (
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-3">Log in to book this expert</p>
                <button onClick={() => navigate('/login')} className="btn-primary w-full">
                  Login to Book
                </button>
              </div>
            ) : !showBooking ? (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  ₹{expert.hourlyRate}
                  <span className="text-sm font-normal text-gray-500">/hr</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">{expert.experience} years experience</p>
                <button
                  id="book-expert-btn"
                  onClick={() => setShowBooking(true)}
                  disabled={!expert.available}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {expert.available ? 'Book a Session' : 'Not Available'}
                </button>
              </div>
            ) : (
              <BookingForm
                expertId={expert._id}
                expertName={name}
                onSuccess={() => setShowBooking(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDetail;
