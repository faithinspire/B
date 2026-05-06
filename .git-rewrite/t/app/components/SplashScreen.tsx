'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function SplashScreen({ isVisible, onComplete }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        onComplete?.();
      }, 600);
    }, 2400);

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 transition-opacity duration-600 ${
      isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Animated Logo */}
        <div className="relative w-32 h-32 mb-8">
          {/* Outer glow ring */}
          <div className={`absolute inset-0 rounded-full border-2 border-white/30 transition-all duration-1000 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
          }`} />
          
          {/* Middle glow ring */}
          <div className={`absolute inset-2 rounded-full border border-white/20 transition-all duration-1000 delay-200 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
          }`} />

          {/* Logo background */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md transition-all duration-1000 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
          }`} />

          {/* Logo text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-5xl font-bold text-white transition-all duration-1000 ${
              isAnimating ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
            }`}>
              B
            </span>
          </div>

          {/* Pulse effect */}
          <div className={`absolute inset-0 rounded-full border-2 border-white/50 transition-all duration-1000 ${
            isAnimating ? 'scale-100 opacity-0' : 'scale-150 opacity-0'
          }`} style={{
            animation: isAnimating ? 'pulse-ring 2s ease-out infinite' : 'none'
          }} />
        </div>

        {/* Brand name */}
        <div className={`text-center transition-all duration-1000 delay-300 ${
          isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className="text-4xl font-bold text-white mb-2">BraidMe</h1>
          <p className="text-white/80 text-sm tracking-widest">Premium Braiding</p>
        </div>

        {/* Loading indicator */}
        <div className={`mt-12 transition-all duration-1000 delay-500 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/60"
                style={{
                  animation: 'bounce 1.4s infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 30px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
