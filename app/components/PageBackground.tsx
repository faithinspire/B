'use client';

import { useEffect, useState } from 'react';

const BACKGROUND_IMAGES = [
  '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png',
  '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png',
  '/images/braiding-styles/b_Professional_photo_o.png',
  '/images/braiding-styles/b_Professional_photo_o (1).png',
  '/images/braiding-styles/b_Professional_photo_o (2).png',
  '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Braider_Working_Imag.png',
];

export function PageBackground() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
      {/* Transitioning Background Images */}
      {BACKGROUND_IMAGES.map((img, idx) => (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-2000"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: idx === currentImageIndex ? 0.2 : 0,
            transitionDuration: '2000ms',
          }}
        />
      ))}
      
      {/* Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-200/70 via-purple-100/70 to-purple-200/70" />
    </div>
  );
}
