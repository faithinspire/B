'use client';

import { useEffect, useState } from 'react';
import { SplashScreen } from './SplashScreen';

export function AppInitializer() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if user has seen splash before
    const hasSeen = localStorage.getItem('splash-seen');
    
    if (hasSeen) {
      setShowSplash(false);
    } else {
      // Show splash on first visit
      const timer = setTimeout(() => {
        localStorage.setItem('splash-seen', 'true');
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <SplashScreen 
      isVisible={showSplash}
      onComplete={() => setShowSplash(false)}
    />
  );
}
