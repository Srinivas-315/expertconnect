import { useState, useEffect } from 'react';

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Check if dismissed before
    if (localStorage.getItem('pwa-dismissed')) return;

    // Listen for browser install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', '1');
  };

  if (!showBanner || installed) return null;

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .pwa-banner { animation: slide-up 0.4s ease-out; }
      `}</style>

      <div className="pwa-banner fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:rounded-2xl md:border md:max-w-sm">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            EC
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Install ExpertConnect</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Add to your home screen for fast access — works offline too!
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                📲 Install App
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1.5 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-300 hover:text-gray-500 text-xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
};

export default InstallBanner;
