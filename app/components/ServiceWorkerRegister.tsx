'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker after page load
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[SW] Service Worker registered successfully:', registration);
      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error);
      }
    };

    // Wait for page to fully load before registering
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    } else {
      // Page already loaded
      registerSW();
    }
  }, []);

  return null;
}
