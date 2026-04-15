import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

// Individual toast that auto-dismisses
const ToastItem = ({ notif, onDismiss }) => {
  const ICONS = {
    new_booking:    '📅',
    booking_status: notif.title?.includes('✅') ? '✅' : '❌',
    new_message:    '💬',
  };

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notif.id), 5000);
    return () => clearTimeout(timer);
  }, [notif.id]);

  return (
    <div
      className="flex items-start gap-3 bg-white border border-gray-200 shadow-lg rounded-xl p-4 w-80 animate-slide-in cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => onDismiss(notif.id)}
    >
      <span className="text-2xl flex-shrink-0">{ICONS[notif.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
        className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
};

// Toast container — bottom-right corner
const ToastContainer = () => {
  const { notifications, clearNotification } = useSocket();
  const [shown, setShown] = useState(new Set());

  const newNotifs = notifications.filter((n) => !shown.has(n.id)).slice(0, 3);

  useEffect(() => {
    if (newNotifs.length > 0) {
      setShown((prev) => {
        const next = new Set(prev);
        newNotifs.forEach((n) => next.add(n.id));
        return next;
      });
    }
  }, [notifications]);

  const [visible, setVisible] = useState([]);

  useEffect(() => {
    const brand = notifications.filter((n) => !n.read).slice(0, 3);
    setVisible(brand);
  }, [notifications]);

  if (visible.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {visible.map((n) => (
          <ToastItem
            key={n.id}
            notif={n}
            onDismiss={(id) => {
              clearNotification(id);
              setVisible((prev) => prev.filter((x) => x.id !== id));
            }}
          />
        ))}
      </div>
    </>
  );
};

export default ToastContainer;
