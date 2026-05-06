/**
 * Image Assets Configuration
 * Centralized management of homepage backgrounds and braider featured images
 */

export const HOMEPAGE_BACKGROUNDS = [
  {
    id: 'hero-bg-1',
    src: '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png',
    alt: 'Hero background with professional braiding',
    category: 'hero',
  },
  {
    id: 'hero-bg-2',
    src: '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png',
    alt: 'Hero background with braiding showcase',
    category: 'hero',
  },
  {
    id: 'knotless-bg',
    src: '/images/braiding-styles/b_Long_knotless_braids.png',
    alt: 'Long knotless braids background',
    category: 'style',
  },
  {
    id: 'box-braid-bg',
    src: '/images/braiding-styles/b_Long_jumbo_box_braid.png',
    alt: 'Long jumbo box braid background',
    category: 'style',
  },
  {
    id: 'professional-bg-1',
    src: '/images/braiding-styles/b_Professional_photo_o.png',
    alt: 'Professional braiding photo background',
    category: 'professional',
  },
  {
    id: 'professional-bg-2',
    src: '/images/braiding-styles/b_Professional_photo_o (1).png',
    alt: 'Professional braiding photo background variant',
    category: 'professional',
  },
  {
    id: 'professional-bg-3',
    src: '/images/braiding-styles/b_Professional_photo_o (2).png',
    alt: 'Professional braiding photo background variant 2',
    category: 'professional',
  },
];

export const BRAIDER_FEATURED_IMAGES = [
  {
    id: 'braider-featured-1',
    src: '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Braider_Working_Imag.png',
    alt: 'Braider working on client hair',
    category: 'working',
  },
  {
    id: 'braider-featured-2',
    src: '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Braider_Working_Imag (1).png',
    alt: 'Braider working on client hair variant',
    category: 'working',
  },
  {
    id: 'braider-featured-3',
    src: '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Braider_Working_Imag.png',
    alt: 'Professional braider at work',
    category: 'working',
  },
  {
    id: 'knotless-featured',
    src: '/images/braiding-styles/b_Long_knotless_braids (1).png',
    alt: 'Long knotless braids featured',
    category: 'style',
  },
  {
    id: 'medium-knotless-featured',
    src: '/images/braiding-styles/b_Medium_knotless_brai.png',
    alt: 'Medium knotless braids featured',
    category: 'style',
  },
  {
    id: 'custom-upload',
    src: '/images/braiding-styles/1771978996158-019c922c-6269-7723-883d-525223c75815.jpeg',
    alt: 'Custom uploaded braider image',
    category: 'custom',
  },
];

export const BRAIDING_STYLE_ICONS = [
  {
    id: 'box-braids',
    src: '/images/braiding-styles/box-braids-1.svg',
    alt: 'Box braids icon',
    label: 'Box Braids',
  },
  {
    id: 'knotless',
    src: '/images/braiding-styles/knotless-1.svg',
    alt: 'Knotless braids icon',
    label: 'Knotless Braids',
  },
  {
    id: 'cornrows',
    src: '/images/braiding-styles/cornrows-1.svg',
    alt: 'Cornrows icon',
    label: 'Cornrows',
  },
  {
    id: 'twists',
    src: '/images/braiding-styles/twists-1.svg',
    alt: 'Twists icon',
    label: 'Twists',
  },
  {
    id: 'locs',
    src: '/images/braiding-styles/locs-1.svg',
    alt: 'Locs icon',
    label: 'Locs',
  },
  {
    id: 'kids',
    src: '/images/braiding-styles/kids-1.svg',
    alt: 'Kids braids icon',
    label: 'Kids Braids',
  },
];

/**
 * Get a random homepage background image
 */
export function getRandomHomepageBackground() {
  return HOMEPAGE_BACKGROUNDS[Math.floor(Math.random() * HOMEPAGE_BACKGROUNDS.length)];
}

/**
 * Get a random braider featured image
 */
export function getRandomBraiderFeaturedImage() {
  return BRAIDER_FEATURED_IMAGES[Math.floor(Math.random() * BRAIDER_FEATURED_IMAGES.length)];
}

/**
 * Get background images by category
 */
export function getBackgroundsByCategory(category: string) {
  return HOMEPAGE_BACKGROUNDS.filter((bg) => bg.category === category);
}

/**
 * Get featured images by category
 */
export function getFeaturedImagesByCategory(category: string) {
  return BRAIDER_FEATURED_IMAGES.filter((img) => img.category === category);
}
