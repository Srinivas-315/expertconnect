import { useState } from 'react';
import { requestBooking } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ expertId, expertName, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');

    setLoading(true);
    setError('');
    try {
      await requestBooking({ expertId, message, scheduledAt: scheduledAt || undefined });
      setSuccess(true);
      setMessage('');
      setScheduledAt('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send booking request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-green-600 text-2xl mb-1">✅</div>
        <p className="font-semibold text-green-800">Booking request sent!</p>
        <p className="text-sm text-green-600">You can track it in your Dashboard.</p>
        <button onClick={() => setSuccess(false)} className="mt-2 text-xs text-green-700 underline">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-gray-900">Book {expertName}</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="booking-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          maxLength={500}
          placeholder="Describe what you need help with..."
          className="input-field resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{message.length}/500</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Date & Time (optional)
        </label>
        <input
          id="booking-date"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="input-field"
        />
      </div>

      <button type="submit" disabled={loading || !message.trim()} className="btn-primary w-full">
        {loading ? 'Sending...' : 'Send Booking Request'}
      </button>
    </form>
  );
};

export default BookingForm;
