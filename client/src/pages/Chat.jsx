import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getChatHistory } from '../api/messages';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Chat = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expertName, setExpertName] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // ── Load chat history from DB ──────────────────────────
  useEffect(() => {
    getChatHistory(bookingId)
      .then((res) => setMessages(res.data.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  // ── Connect Socket.io ──────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join the booking room
      socket.emit('join-room', {
        bookingId,
        userName: user.name,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    // Receive incoming messages in real-time
    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [bookingId, user]);

  // ── Auto-scroll to bottom on new message ──────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send a message ─────────────────────────────────────
  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      bookingId,
      senderId: user._id || user.id,
      senderName: user.name,
      text: trimmed,
    });

    setText('');
  };

  const myId = user?._id || user?.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
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
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-white/80">{connected ? 'Live' : 'Connecting...'}</span>
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
                Messages are end-to-end within this booking room
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId?.toString() === myId?.toString();
              return (
                <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {/* Sender name */}
                    <span className={`text-xs text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    {/* Bubble */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* Timestamp */}
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
        <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              id="chat-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              disabled={!connected}
              maxLength={1000}
              className="input-field flex-1"
              autoComplete="off"
            />
            <button
              id="chat-send"
              type="submit"
              disabled={!text.trim() || !connected}
              className="btn-primary px-5 py-2.5 disabled:opacity-40 flex items-center gap-1"
            >
              Send
              <span>➤</span>
            </button>
          </div>
          {!connected && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Reconnecting to chat server...</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chat;
