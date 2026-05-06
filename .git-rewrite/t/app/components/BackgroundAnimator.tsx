'use client';

import { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '@/app/hooks/usePrefersReducedMotion';

interface BackgroundAnimatorProps {
  images: string[];
  interval?: number;
  transitionDuration?: number;
  className?: string;
}

export function BackgroundAnimator({
  images,
  interval = 5000,
  transitionDuration = 1000,
  className = '',
}: BackgroundAnimatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (images.length === 0 || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setNextIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, transitionDuration);
    }, interval + transitionDuration);

    return () => clearInterval(timer);
  }, [images.length, interval, transitionDuration, prefersReducedMotion]);

  if (images.length === 0) return null;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Current Image */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transitionDuration: `${transitionDuration}ms`,
        }}
      >
        <img
          src={images[currentIndex]}
          alt="Background"
          className="w-full h-full object-cover"
          loading={currentIndex === 0 ? 'eager' : 'lazy'}
        />
      </div>

      {/* Next Image (preloaded) */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          opacity: isTransitioning ? 1 : 0,
          transitionDuration: `${transitionDuration}ms`,
        }}
      >
        <img
          src={images[nextIndex]}
          alt="Background"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Semi-transparent overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
