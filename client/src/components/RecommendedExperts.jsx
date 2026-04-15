import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendedExperts } from '../api/experts';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

const RecommendedExperts = () => {
  const { user } = useAuth();
  const [experts, setExperts] = useState([]);
  const [basedOn, setBasedOn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getRecommendedExperts()
      .then((res) => {
        setExperts(res.data.recommendations);
        setBasedOn(res.data.basedOn);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Don't render if not logged in or no experts
  if (!user || (!loading && experts.length === 0)) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🤖</span>
              <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
            </div>
            {basedOn ? (
              <p className="text-sm text-gray-500">
                Based on your interest in:{' '}
                {basedOn.map((cat, i) => (
                  <span key={cat}>
                    <span className="font-semibold text-blue-600">{cat}</span>
                    {i < basedOn.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Top-rated experts across all categories</p>
            )}
          </div>
          <Link to="/experts" className="text-sm text-blue-600 hover:underline font-medium whitespace-nowrap ml-4">
            See all →
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experts.map((expert) => {
              const name = expert.userId?.name || 'Expert';
              const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <Link
                  to={`/experts/${expert._id}`}
                  key={expert._id}
                  className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {expert.category}
                    </span>
                    <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                      ✅ Available
                    </span>
                  </div>

                  {/* Expert Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRating value={Math.round(expert.avgRating || 0)} size="sm" />
                        <span className="text-xs text-gray-500">
                          {expert.avgRating > 0 ? expert.avgRating.toFixed(1) : 'New'}
                          {expert.totalReviews > 0 && ` (${expert.totalReviews})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{expert.bio}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {expert.skills.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                    {expert.skills.length > 3 && (
                      <span className="text-xs text-gray-400">+{expert.skills.length - 3}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="font-bold text-gray-900">₹{expert.hourlyRate}</span>
                      <span className="text-xs text-gray-500">/hr</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium group-hover:underline">
                      View Profile →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Why these experts */}
        {!loading && basedOn && (
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
            <span>🤖</span>
            <span>
              These recommendations are personalized based on your booking history.
              The algorithm considers <strong className="text-gray-500">category preference</strong>,{' '}
              <strong className="text-gray-500">expert ratings</strong>, and{' '}
              <strong className="text-gray-500">experience</strong>.
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendedExperts;
