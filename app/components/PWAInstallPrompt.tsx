'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) return;

    // Check if already installed as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so it doesn't feel intrusive
      setTimeout(() => setShowPrompt(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show manual instructions after delay
    if (ios) {
      const safari = /safari/i.test(ua) && !/crios|fxios|opios/i.test(ua);
      if (safari) {
        setTimeout(() => setShowPrompt(true), 4000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
  };

  if (isInstalled || dismissed || !showPrompt) return null;

  // iOS instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up">
        <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">✂️</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Install BraidMe</p>
                <p className="text-white/70 text-xs">Add to your home screen</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-gray-700 text-sm font-semibold">Install in 2 steps:</p>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-700 text-xs font-bold">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Tap the{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs font-semibold text-gray-800">
                    <Share className="w-3 h-3" /> Share
                  </span>{' '}
                  button at the bottom of Safari
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-700 text-xs font-bold">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Scroll down and tap{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs font-semibold text-gray-800">
                    <Plus className="w-3 h-3" /> Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            {/* Arrow pointing down to Safari toolbar */}
            <div className="flex justify-center pt-1">
              <div className="flex flex-col items-center gap-1 text-purple-500">
                <div className="w-0.5 h-6 bg-purple-300 rounded-full" />
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-purple-400" />
                <p className="text-xs text-gray-400">Safari toolbar below</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-slide-up">
      <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">✂️</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Install BraidMe App</p>
              <p className="text-white/70 text-xs">Fast, offline-ready experience</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex gap-2 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">⚡ Fast</span>
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">📴 Works offline</span>
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">🔔 Notifications</span>
          </div>
          <button
            onClick={handleInstall}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Install App — It&apos;s Free
          </button>
          <button onClick={handleDismiss} className="w-full mt-2 py-2 text-gray-400 text-xs hover:text-gray-600 transition-colors">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
