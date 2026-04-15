import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            <span className="font-bold text-xl text-gray-900">ExpertConnect</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/experts" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Find Experts
            </Link>
            {user && (
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth + Bell */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* 🔔 Notification Bell */}
                <NotificationBell />

                <span className="text-sm text-gray-600 hidden sm:block ml-1">
                  Hi, <span className="font-semibold text-gray-900">{user.name}</span>
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                    {user.role}
                  </span>
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Login</Link>
                <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
