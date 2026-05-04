'use client';

/**
 * PWA Install Prompt — works on iOS Safari and Android Chrome
 *
 * iOS: Shows manual "Add to Home Screen" instructions (iOS doesn't support
 *      beforeinstallprompt — users must do it manually via Safari share menu)
 *
 * Android: Intercepts the native beforeinstallprompt event and shows a
 *          custom install button
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const promptListenerRef = useRef(false);

  const shouldShow = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Already running as installed PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) return false;

    // User dismissed recently (wait 7 days)
    const ts = localStorage.getItem('pwa_dismissed');
    if (ts && Date.now() - Number(ts) < 7 * 24 * 60 * 60 * 1000) return false;

    return true;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (!isIOS && !isAndroid) return; // Desktop — skip

    if (!shouldShow()) return;

    if (isIOS) {
      // iOS Safari only — Chrome/Firefox on iOS don't support PWA install
      const isSafari = /safari/.test(ua) && !/crios|fxios|opios|chrome/.test(ua);
      if (!isSafari) return;
      setPlatform('ios');
      // Show after a short delay to let page load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } else if (isAndroid) {
      setPlatform('android');
      
      // Set up listener for beforeinstallprompt event
      if (!promptListenerRef.current) {
        promptListenerRef.current = true;
        
        const handleBeforeInstallPrompt = (e: Event) => {
          console.log('[PWA] beforeinstallprompt event fired');
          e.preventDefault();
          const event = e as BeforeInstallPromptEvent;
          setDeferredPrompt(event);
          // Show prompt after a short delay
          setTimeout(() => {
            if (shouldShow()) {
              setShow(true);
            }
          }, 1000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }
    }
  }, [shouldShow]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_dismissed', String(Date.now()));
  };

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShow(false);
        localStorage.setItem('pwa_dismissed', String(Date.now()));
      }
    } catch (err) {
      console.error('[PWA] Install error:', err);
    }
    setInstalling(false);
  };

  if (!show) return null;

  // ─── iOS Safari ──────────────────────────────────────────────────────────
  if (platform === 'ios') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[99999]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Semi-transparent backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 cursor-pointer" 
          style={{ top: '-200vh' }} 
          onClick={dismiss}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && dismiss()}
        />

        <div className="relative bg-white rounded-t-3xl shadow-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-3xl">✂️</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Install BraidMe</p>
                <p className="text-gray-500 text-xs">Free • Works offline • No App Store</p>
              </div>
            </div>
            <button 
              onClick={dismiss} 
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 active:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Steps */}
          <div className="px-5 pb-2 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Add to Home Screen in 2 steps:</p>

            <div className="flex items-center gap-3 bg-purple-50 rounded-2xl p-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Share className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">1. Tap the Share button</p>
                <p className="text-xs text-gray-500">The square with arrow at the bottom of Safari</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-pink-50 rounded-2xl p-3">
              <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">2. Tap "Add to Home Screen"</p>
                <p className="text-xs text-gray-500">Scroll down in the share sheet to find it</p>
              </div>
            </div>
          </div>

          {/* Arrow pointing to Safari toolbar */}
          <div className="flex flex-col items-center py-3">
            <div className="w-px h-8 bg-purple-300" />
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-purple-500" />
            <p className="text-xs text-gray-400 mt-1">Safari toolbar is here ↓</p>
          </div>

          <div className="px-5 pb-6">
            <button 
              onClick={dismiss} 
              className="w-full py-2.5 text-gray-400 text-sm active:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Android Chrome ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-x-3 bottom-4 z-[99999]">
      <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow flex-shrink-0">
              <span className="text-2xl">✂️</span>
            </div>
            <div>
              <p className="text-white font-bold">Install BraidMe</p>
              <p className="text-white/80 text-xs">Free app • Works offline</p>
            </div>
          </div>
          <button 
            onClick={dismiss} 
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 active:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {['⚡ Fast', '📴 Offline', '🔔 Notifications', '📱 App-like'].map(f => (
              <span key={f} className="text-xs text-gray-600 px-2.5 py-1 bg-gray-100 rounded-full">{f}</span>
            ))}
          </div>

          <button
            onClick={install}
            disabled={installing || !deferredPrompt}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg active:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {installing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Install App — Free
              </>
            )}
          </button>

          <button 
            onClick={dismiss} 
            className="w-full mt-2 py-2 text-gray-400 text-xs active:text-gray-600 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
