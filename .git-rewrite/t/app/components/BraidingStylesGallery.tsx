'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface BraidingStyle {
  id: string;
  src: string;
  alt: string;
  style: string;
  title: string;
}

interface BraidingStylesGalleryProps {
  className?: string;
}

const braidingStyles: BraidingStyle[] = [
  {
    id: '1',
    src: '/images/braiding-styles/b_Long_jumbo_box_braid.png',
    alt: 'Long jumbo box braids with professional styling',
    style: 'box_braids',
    title: 'Box Braids',
  },
  {
    id: '2',
    src: '/images/braiding-styles/b_Long_knotless_braids.png',
    alt: 'Long knotless braids with smooth, seamless appearance',
    style: 'knotless',
    title: 'Knotless Braids',
  },
  {
    id: '3',
    src: '/images/braiding-styles/b_Long_knotless_braids (1).png',
    alt: 'Knotless braids variant with beautiful finish',
    style: 'knotless',
    title: 'Knotless Braids Pro',
  },
  {
    id: '4',
    src: '/images/braiding-styles/b_Medium_knotless_brai.png',
    alt: 'Medium knotless braids with elegant styling',
    style: 'knotless',
    title: 'Medium Knotless',
  },
  {
    id: '5',
    src: '/images/braiding-styles/b_Professional_photo_o.png',
    alt: 'Professional braiding work showcase',
    style: 'professional',
    title: 'Professional Work',
  },
  {
    id: '6',
    src: '/images/braiding-styles/b_Professional_photo_o (1).png',
    alt: 'Professional braiding service example',
    style: 'professional',
    title: 'Expert Braiding',
  },
];

interface GalleryImageProps extends BraidingStyle {
  onError?: () => void;
}

function GalleryImage({ src, alt, title, onError }: GalleryImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-8 h-8 text-primary-600 mb-2" />
        <p className="text-center text-sm font-semibold text-gray-700">{title}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden group bg-gray-100">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={handleError}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </div>
  );
}

export function BraidingStylesGallery({ className = '' }: BraidingStylesGalleryProps) {
  return (
    <section className={`py-16 sm:py-24 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
            Braiding Styles
          </h2>
          <p className="text-lg text-gray-600">Explore the variety of beautiful braiding styles we offer</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {braidingStyles.map((style) => (
            <div
              key={style.id}
              className="group cursor-pointer"
              role="img"
              aria-label={style.alt}
            >
              <GalleryImage {...style} />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {style.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
