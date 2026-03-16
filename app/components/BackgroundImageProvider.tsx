'use client';

import { ReactNode } from 'react';

interface BackgroundImageProviderProps {
  children: ReactNode;
}

export function BackgroundImageProvider({ children }: BackgroundImageProviderProps) {
  // Simplified provider - just renders children without background effects
  // to fix HTML rendering issue on homepage

  return (
    <div className="relative">
      {/* Content Layer */}
      <div className="relative z-30">
        {children}
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
