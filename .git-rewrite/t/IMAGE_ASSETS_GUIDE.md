# Image Assets Guide

## Overview
All images from the public folder have been scanned and organized into centralized collections for easy access throughout the application.

## Image Collections

### 1. Homepage Backgrounds (7 images)
Located in `lib/imageAssets.ts` - `HOMEPAGE_BACKGROUNDS`

**Hero Category (2 images):**
- `gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png` - Professional braiding hero background
- `gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png` - Braiding showcase hero background

**Style Category (2 images):**
- `b_Long_knotless_braids.png` - Long knotless braids
- `b_Long_jumbo_box_braid.png` - Long jumbo box braid

**Professional Category (3 images):**
- `b_Professional_photo_o.png` - Professional braiding photo
- `b_Professional_photo_o (1).png` - Professional braiding photo variant
- `b_Professional_photo_o (2).png` - Professional braiding photo variant 2

### 2. Braider Featured Images (6 images)
Located in `lib/imageAssets.ts` - `BRAIDER_FEATURED_IMAGES`

**Working Category (3 images):**
- `gpt-image-1.5-high-fidelity_a_Braider_Working_Imag.png` - Braider working on client
- `gpt-image-1.5-high-fidelity_a_Braider_Working_Imag (1).png` - Braider working variant
- `gemini-3-pro-image-preview-2k_b_Braider_Working_Imag.png` - Professional braider at work

**Style Category (2 images):**
- `b_Long_knotless_braids (1).png` - Long knotless braids featured
- `b_Medium_knotless_brai.png` - Medium knotless braids featured

**Custom Category (1 image):**
- `1771978996158-019c922c-6269-7723-883d-525223c75815.jpeg` - Custom uploaded image

### 3. Braiding Style Icons (6 SVG icons)
Located in `lib/imageAssets.ts` - `BRAIDING_STYLE_ICONS`

- `box-braids-1.svg` - Box Braids
- `knotless-1.svg` - Knotless Braids
- `cornrows-1.svg` - Cornrows
- `twists-1.svg` - Twists
- `locs-1.svg` - Locs
- `kids-1.svg` - Kids Braids

## Usage Examples

### Import and Use
```typescript
import {
  HOMEPAGE_BACKGROUNDS,
  BRAIDER_FEATURED_IMAGES,
  BRAIDING_STYLE_ICONS,
  getRandomHomepageBackground,
  getRandomBraiderFeaturedImage,
  getBackgroundsByCategory,
  getFeaturedImagesByCategory,
} from '@/lib/imageAssets';

// Get a random background for homepage
const randomBg = getRandomHomepageBackground();

// Get a random featured image for braider profile
const randomFeatured = getRandomBraiderFeaturedImage();

// Get all hero backgrounds
const heroBgs = getBackgroundsByCategory('hero');

// Get all working images
const workingImages = getFeaturedImagesByCategory('working');

// Use in components
<img src={randomBg.src} alt={randomBg.alt} />
```

### In Components
```typescript
import { HOMEPAGE_BACKGROUNDS } from '@/lib/imageAssets';

export function HomePage() {
  const backgrounds = HOMEPAGE_BACKGROUNDS;
  
  return (
    <div className="relative">
      {backgrounds.map((bg) => (
        <img key={bg.id} src={bg.src} alt={bg.alt} />
      ))}
    </div>
  );
}
```

### In Braider Profile
```typescript
import { BRAIDER_FEATURED_IMAGES } from '@/lib/imageAssets';

export function BraiderProfile() {
  const featuredImages = BRAIDER_FEATURED_IMAGES;
  
  return (
    <div>
      {featuredImages.map((img) => (
        <img key={img.id} src={img.src} alt={img.alt} />
      ))}
    </div>
  );
}
```

## File Structure
```
public/
└── images/
    └── braiding-styles/
        ├── Hero backgrounds (2)
        ├── Braider working images (3)
        ├── Braiding style photos (5)
        ├── Professional photos (3)
        ├── Custom uploads (1)
        └── Style icons (6 SVG)
```

## Adding New Images

1. Add image to `public/images/braiding-styles/`
2. Update `lib/imageAssets.ts` with new entry
3. Specify appropriate category and alt text
4. Use the centralized collection in components

## Categories

**Homepage Backgrounds:**
- `hero` - Full-page hero backgrounds
- `style` - Specific braiding style showcases
- `professional` - Professional photography

**Braider Featured Images:**
- `working` - Braiders actively working
- `style` - Specific braiding style examples
- `custom` - User-uploaded images

## Total Assets
- Homepage Backgrounds: 7 images
- Braider Featured Images: 6 images
- Braiding Style Icons: 6 SVG icons
- **Total: 19 assets**
