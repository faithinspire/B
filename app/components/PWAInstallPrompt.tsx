'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the deferred prompt globally so it's not lost if component remounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const checkAndShow = useCallback(() => {
    // Already installed as PWA — never show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (don't show for 3 days after dismiss)
    const dismissedAt = localStorage.getItem('pwa-dismissed-at');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return;
    }

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    const isMobile = ios || android;

    if (!isMobile) return; // Only show on mobile

    setIsIOS(ios);

    if (ios) {
      // iOS Safari — always show manual instructions (no beforeinstallprompt on iOS)
      const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|chrome/i.test(ua);
      if (isSafari) {
        setTimeout(() => setShowPrompt(true), 2500);
      }
    } else if (android) {
      // Android — use deferred prompt if available, otherwise show manual
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
        setTimeout(() => setShowPrompt(true), 2500);
      }
      // The beforeinstallprompt listener below will also trigger it
    }
  }, []);

  useEffect(() => {
    // Listen for beforeinstallprompt ASAP (before component fully renders)
    const handler = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if we should show
      const dismissedAt = localStorage.getItem('pwa-dismissed-at');
      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 3) return;
      }

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (!isStandalone) {
        setTimeout(() => setShowPrompt(true), 2500);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Run check after a short delay to let auth settle
    const timer = setTimeout(checkAndShow, 1500);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      globalDeferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [checkAndShow]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          globalDeferredPrompt = null;
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setInstalling(false);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed-at', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  // ─── iOS Safari — manual instructions ────────────────────────────────────
  if (isIOS) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          style={{ top: '-100vh' }}
          onClick={handleDismiss}
        />

        {/* Card */}
        <div className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Purple header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl">✂️</span>
                </div>
                <div>
                  <p className="text-white font-bold text-base">Install BraidMe</p>
                  <p className="text-white/80 text-xs">Free • Works offline • No App Store needed</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-gray-800 font-semibold text-sm">Add to Home Screen in 2 taps:</p>

            {/* Step 1 */}
            <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-2xl">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Share className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Step 1 — Tap Share</p>
                <p className="text-xs text-gray-500">The share icon at the bottom of Safari</p>
              </div>
              <div className="ml-auto text-2xl">⬇️</div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4 p-3 bg-pink-50 rounded-2xl">
              <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Step 2 — Add to Home Screen</p>
                <p className="text-xs text-gray-500">Scroll down in the share menu</p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Arrow pointing down */}
          <div className="flex justify-center pb-3">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-px h-5 bg-purple-300" />
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-400" />
              <p className="text-xs text-gray-400 mt-1">Safari toolbar is here ↓</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Android / Chrome — native install prompt ─────────────────────────────
  return (
    <div className="fixed bottom-4 left-3 right-3 z-[9999] animate-slide-up">
      <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-2xl">✂️</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Install BraidMe</p>
              <p className="text-white/80 text-xs">Free app • Works offline</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Feature pills */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['⚡ Fast', '📴 Offline', '🔔 Notifications', '📱 App-like'].map(f => (
              <span key={f} className="text-xs text-gray-600 px-2.5 py-1 bg-gray-100 rounded-full font-medium">
                {f}
              </span>
            ))}
          </div>

          {/* Install button */}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-70"
          >
            {installing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Install App — It&apos;s Free
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="w-full mt-2 py-2 text-gray-400 text-xs hover:text-gray-600 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
