import React from 'react';

interface BraidMeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BraidMeLogo({ size = 'md', showText = true, className = '' }: BraidMeLogoProps) {
  const iconSizes = { sm: 28, md: 36, lg: 52 };
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  const iconSize = iconSizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Braided B Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="bm-grad1" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="45%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="bm-grad2" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="bm-grad3" x1="0" y1="80" x2="80" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Vertical spine of B */}
        <rect x="10" y="8" width="11" height="64" rx="5.5" fill="url(#bm-grad1)" />

        {/* Upper braid bump */}
        {/* Strand 1 - back */}
        <path d="M18 10 C18 10 52 10 52 26 C52 38 30 38 30 38 L18 38" stroke="url(#bm-grad3)" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.5"/>
        {/* Strand 2 - front */}
        <path d="M18 10 C18 10 56 12 56 28 C56 42 18 42 18 42" stroke="url(#bm-grad1)" strokeWidth="8" strokeLinecap="round" fill="none"/>
        {/* Braid cross cuts upper */}
        <path d="M28 12 C32 18 26 24 30 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <path d="M38 11 C43 18 36 25 41 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <path d="M48 14 C51 21 46 28 49 35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>

        {/* Lower braid bump */}
        {/* Strand 1 - back */}
        <path d="M18 40 C18 40 56 40 56 56 C56 70 30 70 30 70 L18 70" stroke="url(#bm-grad3)" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.5"/>
        {/* Strand 2 - front */}
        <path d="M18 40 C18 40 62 42 62 60 C62 74 18 74 18 74" stroke="url(#bm-grad2)" strokeWidth="8" strokeLinecap="round" fill="none"/>
        {/* Braid cross cuts lower */}
        <path d="M28 43 C33 50 27 56 32 63" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <path d="M40 42 C45 50 38 57 43 64" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <path d="M52 45 C55 53 50 59 53 67" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      </svg>

      {/* Text */}
      {showText && (
        <span className={`font-bold ${textSizes[size]} leading-none`}>
          <span style={{ color: '#3b1d8a' }}>Braid</span>
          <span style={{ color: '#ec4899' }}>Me</span>
        </span>
      )}
    </div>
  );
}
