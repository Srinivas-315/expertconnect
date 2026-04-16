import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAdminStats,
  getAdminUsers,
  banUser,
  getAdminExperts,
  approveExpert,
  rejectExpert,
  getAdminBookings,
  sendTestEmail,
} from '../api/admin';

// ── Helpers ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${color} shadow-lg`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/70 text-sm font-medium">{label}</p>
        <p className="text-3xl font-extrabold mt-1">{value ?? '—'}</p>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </div>
      <span className="text-4xl opacity-80">{icon}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
  </div>
);

const Badge = ({ status }) => {
  const map = {
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-green-100  text-green-700  border-green-200',
    cancelled: 'bg-red-100    text-red-700    border-red-200',
  };
  const icon = { pending: '⏳', confirmed: '✅', cancelled: '❌' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {icon[status]} {status}
    </span>
  );
};

const TABS = [
  { id: 'overview', label: 'Overview',  icon: '📊' },
  { id: 'users',    label: 'Users',     icon: '👥' },
  { id: 'experts',  label: 'Experts',   icon: '🎓' },
  { id: 'bookings', label: 'Bookings',  icon: '📅' },
];

// ── Main Component ────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]           = useState('overview');
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [experts, setExperts]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Expert reject modal
  const [rejectModal, setRejectModal]   = useState(null); // { expertId, expertName }
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Email test
  const [testEmailInput, setTestEmailInput] = useState('');
  const [emailLoading, setEmailLoading]     = useState(false);
  const [emailResult, setEmailResult]       = useState(null);

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); };

  // Guard: only admin
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  // Load data per tab
  const loadTab = useCallback(async (t) => {
    setLoading(true);
    try {
      if (t === 'overview') {
        const r = await getAdminStats();
        setStats(r.data);
      } else if (t === 'users') {
        const r = await getAdminUsers();
        setUsers(r.data.users);
      } else if (t === 'experts') {
        const r = await getAdminExperts();
        setExperts(r.data.experts);
      } else if (t === 'bookings') {
        const r = await getAdminBookings();
        setBookings(r.data.bookings);
      }
    } catch (e) {
      toast('❌ Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleBan = async (userId, isBanned) => {
    try {
      await banUser(userId);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isBanned: !isBanned } : u));
      toast(isBanned ? '✅ User unbanned' : '🚫 User banned');
    } catch { toast('❌ Action failed'); }
  };

  const handleApprove = async (expertId) => {
    try {
      await approveExpert(expertId);
      setExperts((prev) => prev.map((e) => e._id === expertId ? { ...e, isApproved: true, isRejected: false } : e));
      toast('✅ Expert approved & now publicly visible');
    } catch { toast('❌ Action failed'); }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    setRejectLoading(true);
    try {
      await rejectExpert(rejectModal.expertId, rejectReason || 'Does not meet platform requirements');
      setExperts((prev) => prev.map((e) => e._id === rejectModal.expertId ? { ...e, isApproved: false, isRejected: true, rejectionReason: rejectReason } : e));
      toast('❌ Expert profile rejected');
      setRejectModal(null);
      setRejectReason('');
    } catch { toast('❌ Action failed'); }
    finally { setRejectLoading(false); }
  };

  const handleTestEmail = async () => {
    if (!testEmailInput.trim()) return;
    setEmailLoading(true);
    setEmailResult(null);
    try {
      const r = await sendTestEmail(testEmailInput.trim());
      setEmailResult({ success: true, msg: r.data.message, note: r.data.note });
    } catch (e) {
      setEmailResult({ success: false, msg: e.response?.data?.message || 'Failed to send', note: e.response?.data?.hint });
    } finally { setEmailLoading(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl shadow-2xl text-sm animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-1">Reject Expert Profile</h3>
            <p className="text-sm text-gray-400 mb-4">
              Rejecting <span className="text-white font-semibold">{rejectModal.expertName}</span>. Provide a reason (optional):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Incomplete profile, insufficient experience..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectSubmit}
                disabled={rejectLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {rejectLoading ? 'Rejecting...' : '❌ Confirm Reject'}
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm">A</div>
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-500">ExpertConnect Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">Logged in as <span className="text-violet-400 font-semibold">{user?.name}</span></span>
            <button onClick={() => navigate('/')} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              ← Back to App
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon} {t.label}
              {t.id === 'experts' && experts.filter((e) => !e.isApproved && !e.isRejected).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {experts.filter((e) => !e.isApproved && !e.isRejected).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Loading ─────────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ══════════════ TAB: OVERVIEW ══════════════════════════════════════ */}
        {!loading && tab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="👥" label="Total Users"      value={stats.totalUsers}      color="bg-gradient-to-br from-blue-600 to-blue-800"   sub="Registered accounts" />
              <StatCard icon="🎓" label="Total Experts"    value={stats.totalExperts}    color="bg-gradient-to-br from-violet-600 to-violet-800" sub={`${stats.pendingExperts} pending approval`} />
              <StatCard icon="📅" label="Total Bookings"   value={stats.totalBookings}   color="bg-gradient-to-br from-emerald-600 to-emerald-800" sub={`${stats.confirmedBookings} confirmed`} />
              <StatCard icon="🚫" label="Banned Users"     value={stats.bannedUsers}     color="bg-gradient-to-br from-red-600 to-red-800"      sub="Restricted accounts" />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Pending Bookings',   value: stats.pendingBookings,   icon: '⏳', color: 'text-yellow-400' },
                { label: 'Confirmed Bookings', value: stats.confirmedBookings, icon: '✅', color: 'text-emerald-400' },
                { label: 'Cancelled Bookings', value: stats.cancelledBookings, icon: '❌', color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
                  <span className="text-3xl">{s.icon}</span>
                  <div>
                    <p className="text-gray-400 text-sm">{s.label}</p>
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Expert Alert */}
            {stats.pendingExperts > 0 && (
              <div className="bg-yellow-950/60 border border-yellow-700/50 rounded-2xl p-5 flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-300">{stats.pendingExperts} expert profile{stats.pendingExperts !== 1 ? 's' : ''} awaiting approval</p>
                  <p className="text-sm text-yellow-500/80 mt-0.5">Review them in the <strong>Experts tab</strong> to make them publicly visible.</p>
                  <button onClick={() => setTab('experts')} className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
                    Review Experts →
                  </button>
                </div>
              </div>
            )}

            {/* Email Test Panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-bold text-gray-100">Email System Test</h3>
                  <p className="text-sm text-gray-500">Verify that Resend email delivery is working correctly</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  placeholder="Enter email to test (e.g. you@gmail.com)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={emailLoading || !testEmailInput.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
                >
                  {emailLoading ? 'Sending...' : '✉️ Send Test'}
                </button>
              </div>
              {emailResult && (
                <div className={`mt-3 rounded-xl px-4 py-3 text-sm border ${emailResult.success ? 'bg-emerald-950/50 border-emerald-700/40 text-emerald-300' : 'bg-red-950/50 border-red-700/40 text-red-300'}`}>
                  <p className="font-semibold">{emailResult.msg}</p>
                  {emailResult.note && <p className="text-xs mt-1 opacity-70">{emailResult.note}</p>}
                </div>
              )}
              <div className="mt-3 bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500">
                <p>✅ <span className="text-gray-400">RESEND_API_KEY</span> is configured &nbsp;·&nbsp; Emails sent from <code className="text-violet-400">onboarding@resend.dev</code></p>
                <p className="mt-1">💡 Check your spam folder. To send from a custom domain, verify it in your <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-violet-400 underline">Resend dashboard</a>.</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: USERS ═════════════════════════════════════════ */}
        {!loading && tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">All Users <span className="text-gray-500 text-base font-normal">({users.length})</span></h2>
              <button onClick={() => loadTab('users')} className="text-xs text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">↻ Refresh</button>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-20 text-gray-600">No users found</div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-400">User</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400 hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400">Role</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400">Status</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400 hidden sm:table-cell">Joined</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u._id} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors ${i === users.length - 1 ? 'border-0' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${u.role === 'admin' ? 'bg-violet-600' : u.role === 'expert' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-200 truncate max-w-[120px]">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-400 hidden md:table-cell truncate max-w-[160px]">{u.email}</td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                            u.role === 'admin'  ? 'bg-violet-900/50 text-violet-300 border-violet-700/50' :
                            u.role === 'expert' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50' :
                                                  'bg-blue-900/50 text-blue-300 border-blue-700/50'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-4">
                          {u.isBanned
                            ? <span className="text-xs px-2.5 py-1 rounded-full bg-red-900/50 text-red-300 border border-red-700/50">🚫 Banned</span>
                            : <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">✅ Active</span>
                          }
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs hidden sm:table-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleBan(u._id, u.isBanned)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                u.isBanned
                                  ? 'bg-emerald-900/30 hover:bg-emerald-900/60 text-emerald-400 border-emerald-700/50'
                                  : 'bg-red-900/30 hover:bg-red-900/60 text-red-400 border-red-700/50'
                              }`}
                            >
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                          )}
                          {u.role === 'admin' && <span className="text-xs text-gray-600 italic">protected</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: EXPERTS ════════════════════════════════════════ */}
        {!loading && tab === 'experts' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Expert Profiles
                <span className="text-gray-500 text-base font-normal ml-2">({experts.length})</span>
                {experts.filter((e) => !e.isApproved && !e.isRejected).length > 0 && (
                  <span className="ml-2 text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-600/40 px-2.5 py-0.5 rounded-full">
                    {experts.filter((e) => !e.isApproved && !e.isRejected).length} pending
                  </span>
                )}
              </h2>
              <button onClick={() => loadTab('experts')} className="text-xs text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">↻ Refresh</button>
            </div>

            {experts.length === 0 ? (
              <div className="text-center py-20 text-gray-600">No expert profiles found</div>
            ) : (
              <div className="space-y-4">
                {experts.map((e) => {
                  const name = e.userId?.name || 'Unknown';
                  const email = e.userId?.email || '';
                  const isPending  = !e.isApproved && !e.isRejected;
                  const isApproved = e.isApproved;
                  const isRejected = e.isRejected;

                  return (
                    <div key={e._id} className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${isPending ? 'border-yellow-600/40' : isApproved ? 'border-emerald-700/30' : 'border-red-700/30'}`}>
                      <div className="flex items-start gap-4 flex-wrap">
                        {/* Avatar + Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {e.photoUrl ? (
                            <img src={e.photoUrl} alt={name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-100">{name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${isPending ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40' : isApproved ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40' : 'bg-red-900/40 text-red-400 border-red-700/40'}`}>
                                {isPending ? '⏳ Pending' : isApproved ? '✅ Approved' : '❌ Rejected'}
                              </span>
                              {e.userId?.isBanned && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-700/40">🚫 User Banned</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{email}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-700">📂 {e.category}</span>
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-700">⏱ {e.experience} yrs</span>
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-700">₹{e.hourlyRate}/hr</span>
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-700">⭐ {e.avgRating || 0}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{e.bio}</p>
                            {/* Skills */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {e.skills?.slice(0, 5).map((s, i) => (
                                <span key={i} className="text-xs bg-violet-900/30 text-violet-400 border border-violet-700/40 px-2 py-0.5 rounded-md">{s}</span>
                              ))}
                              {e.skills?.length > 5 && <span className="text-xs text-gray-600">+{e.skills.length - 5} more</span>}
                            </div>
                            {isRejected && e.rejectionReason && (
                              <p className="text-xs text-red-400/80 mt-2 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-1.5">
                                <strong>Rejection reason:</strong> {e.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!isApproved && (
                            <button
                              onClick={() => handleApprove(e._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                            >
                              ✅ Approve
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              onClick={() => { setRejectModal({ expertId: e._id, expertName: name }); setRejectReason(''); }}
                              className="bg-red-900/50 hover:bg-red-900/80 border border-red-700/50 text-red-400 text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                            >
                              ❌ Reject
                            </button>
                          )}
                          {isApproved && (
                            <span className="text-xs text-emerald-500/60 text-center">Live on platform</span>
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

        {/* ══════════════ TAB: BOOKINGS ═══════════════════════════════════════ */}
        {!loading && tab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">All Bookings <span className="text-gray-500 text-base font-normal">({bookings.length})</span></h2>
              <button onClick={() => loadTab('bookings')} className="text-xs text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">↻ Refresh</button>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-20 text-gray-600">No bookings found</div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-400">Client</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400 hidden lg:table-cell">Expert</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400">Status</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400 hidden md:table-cell">Scheduled</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-400 hidden sm:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => {
                      const clientName = b.userId?.name || '—';
                      const expertName = b.expertId?.userId?.name || '—';
                      return (
                        <tr key={b._id} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors ${i === bookings.length - 1 ? 'border-0' : ''}`}>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-gray-200">{clientName}</p>
                              <p className="text-xs text-gray-500">{b.userId?.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <p className="font-medium text-gray-300">{expertName}</p>
                            <p className="text-xs text-gray-500">{b.expertId?.category}</p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge status={b.status} />
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-xs hidden md:table-cell">
                            {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-4 text-gray-500 text-xs hidden sm:table-cell">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminPanel;
