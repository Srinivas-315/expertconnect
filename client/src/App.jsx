import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import InstallBanner from './components/InstallBanner';
import { useRegisterSW } from 'virtual:pwa-register/react';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Experts from './pages/Experts';
import ExpertDetail from './pages/ExpertDetail';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

function App() {
  // Auto-update service worker when new version is deployed
  useRegisterSW({ immediate: true });
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/experts" element={<Experts />} />
                <Route path="/experts/:id" element={<ExpertDetail />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:bookingId"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
              <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
                © {new Date().getFullYear()} ExpertConnect. Built with React + Node.js + MongoDB + Socket.io
              </div>
            </footer>
          </div>

          {/* 🔔 Global Toast Notifications */}
          <ToastContainer />

          {/* 📲 PWA Install Banner */}
          <InstallBanner />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
