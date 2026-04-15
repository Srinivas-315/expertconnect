import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const ExpertCard = ({ expert }) => {
  const { _id, userId, skills, experience, bio, hourlyRate, category, avgRating, totalReviews, photoUrl } = expert;
  const name = userId?.name || 'Expert';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-blue-100" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{category}</span>
        </div>
      </div>

      {/* ⭐ Rating */}
      <div className="flex items-center gap-2">
        <StarRating value={Math.round(avgRating || 0)} size="sm" />
        <span className="text-sm font-semibold text-gray-700">
          {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
        </span>
        {totalReviews > 0 && (
          <span className="text-xs text-gray-400">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 line-clamp-2">{bio}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {skills.slice(0, 4).map((skill, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
            {skill}
          </span>
        ))}
        {skills.length > 4 && (
          <span className="text-xs text-gray-500 px-2 py-1">+{skills.length - 4} more</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <span className="text-lg font-bold text-gray-900">₹{hourlyRate}</span>
          <span className="text-xs text-gray-500">/hr</span>
          <div className="text-xs text-gray-500">{experience} yrs experience</div>
        </div>
        <Link to={`/experts/${_id}`} className="btn-primary text-sm">
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default ExpertCard;
