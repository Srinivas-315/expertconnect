/**
 * StarRating — reusable star component
 * Props:
 *   value: number (current rating, 0–5)
 *   onChange: function (called when user clicks a star) — if omitted, read-only
 *   size: 'sm' | 'md' | 'lg'
 */
const SIZE = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

const StarRating = ({ value = 0, onChange, size = 'md' }) => {
  const interactive = typeof onChange === 'function';

  return (
    <div className={`flex items-center gap-0.5 ${SIZE[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          className={`leading-none transition-transform ${
            interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'
          } ${star <= value ? 'text-yellow-400' : 'text-gray-200'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;
