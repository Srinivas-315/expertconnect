import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChatHistory, sendMessage as sendMessageAPI } from '../api/messages';

// HTTP Polling Chat — works on Vercel serverless (no WebSockets needed)
const POLL_INTERVAL = 3000; // Fetch new messages every 3 seconds

const Chat = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load messages & start polling ───────────────────────
  const fetchMessages = async (silent = false) => {
    try {
      const res = await getChatHistory(bookingId);
      const newMsgs = res.data.messages;
      setMessages(newMsgs);
      setLastCount(newMsgs.length);
    } catch (err) {
      // Silently fail on polling errors
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(); // Initial load
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [bookingId]);

  // ── Auto-scroll on new messages ──────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message via REST API ────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');

    // Optimistic UI — show message immediately
    const optimistic = {
      _id: `temp-${Date.now()}`,
      senderId: user._id || user.id,
      senderName: user.name,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessageAPI({ bookingId, text: trimmed });
      await fetchMessages(true); // Sync with server
    } catch (err) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(trimmed); // Restore text
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const myId = user?._id || user?.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[75vh]">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              💬
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Booking Chat</p>
              <p className="text-blue-100 text-xs">Booking #{bookingId.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/80">● Live</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-5xl mb-3">👋</div>
              <p className="font-semibold text-gray-700">Start the conversation!</p>
              <p className="text-sm text-gray-400 mt-1">
                Messages are saved and synced every few seconds
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId?.toString() === myId?.toString();
              return (
                <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <span className={`text-xs text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                      } ${msg._id?.startsWith('temp-') ? 'opacity-70' : ''}`}
                    >
                      {msg.text}
                      {msg._id?.startsWith('temp-') && (
                        <span className="ml-1 text-xs opacity-60">⏳</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-300">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              maxLength={1000}
              className="input-field flex-1"
              autoComplete="off"
            />
            <button
              id="chat-send"
              type="submit"
              disabled={!text.trim() || sending}
              className="btn-primary px-5 py-2.5 disabled:opacity-40 flex items-center gap-1"
            >
              {sending ? '⏳' : 'Send ➤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
