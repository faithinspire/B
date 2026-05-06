# Design Document: Homepage Braiding Styles Gallery

## Overview

This feature enhances the Braidly homepage by adding two visual components: a static gallery section displaying various braiding styles and an animated background in the hero section that cycles through braiding style images. The implementation leverages Next.js 14's Image component for optimization, React hooks for animation state management, and Tailwind CSS for responsive styling consistent with the existing design system.

The gallery serves as both a visual showcase and an educational tool, helping visitors understand the variety of braiding styles available on the platform. The animated hero background creates an engaging first impression while maintaining accessibility and performance standards.

## Architecture

### Component Structure

```
app/(public)/page.tsx (existing)
├── HeroSection (modified)
│   └── BackgroundAnimator (new component)
└── BraidingStylesGallery (new component)
    └── GalleryImage (sub-component)
```

### File Organization

```
app/
├── (public)/
│   └── page.tsx                          # Modified to include new gallery section
├── components/
│   ├── BackgroundAnimator.tsx            # New: Hero background animation
│   └── BraidingStylesGallery.tsx         # New: Gallery section component
public/
└── images/
    └── braiding-styles/                  # New: Image assets directory
        ├── box-braids-1.webp
        ├── box-braids-2.webp
        ├── knotless-1.webp
        ├── knotless-2.webp
        ├── cornrows-1.webp
        ├── locs-1.webp
        ├── twists-1.webp
        └── kids-1.webp
```

### Technology Stack

- **Next.js 14**: App Router, Image component for optimization
- **React 18**: Hooks (useState, useEffect, useRef) for state and lifecycle management
- **TypeScript**: Type safety for component props and state
- **Tailwind CSS**: Responsive styling and animations
- **Lucide React**: Icons (if needed for gallery navigation)

## Components and Interfaces

### BackgroundAnimator Component

**Purpose**: Manages the animated background images in the hero section with smooth crossfade transitions.

**Props Interface**:
```typescript
interface BackgroundAnimatorProps {
  images: string[];              // Array of image paths
  interval?: number;             // Time between transitions (default: 5000ms)
  transitionDuration?: number;   // Fade duration (default: 1000ms)
  className?: string;            // Additional CSS classes
}
```

**State Management**:
```typescript
const [currentIndex, setCurrentIndex] = useState(0);
const [nextIndex, setNextIndex] = useState(1);
const [isTransitioning, setIsTransitioning] = useState(false);
const prefersReducedMotion = usePrefersReducedMotion(); // Custom hook
```

**Key Features**:
- Preloads next image before transition
- Respects `prefers-reduced-motion` media query
- Uses CSS opacity transitions for smooth crossfade
- Automatically loops through image collection
- Cleans up intervals on unmount

**Implementation Strategy**:
1. Render two image layers (current and next)
2. Use opacity transitions to crossfade between layers
3. Preload next image using Next.js Image priority prop
4. Use `useEffect` with interval for automatic progression
5. Apply semi-transparent overlay for text readability

### BraidingStylesGallery Component

**Purpose**: Displays a responsive grid of braiding style images with hover effects and accessibility features.

**Props Interface**:
```typescript
interface BraidingStylesGalleryProps {
  className?: string;
}

interface BraidingStyle {
  id: string;
  src: string;
  alt: string;
  style: string;  // 'box_braids' | 'knotless' | 'cornrows' | 'locs' | 'twists' | 'kids'
  title: string;
}
```

**Data Structure**:
```typescript
const braidingStyles: BraidingStyle[] = [
  {
    id: '1',
    src: '/images/braiding-styles/box-braids-1.webp',
    alt: 'Long box braids with beads',
    style: 'box_braids',
    title: 'Box Braids'
  },
  // ... more styles
];
```

**Key Features**:
- Responsive grid layout (1/2/3 columns based on viewport)
- Lazy loading for images below the fold
- Hover effects with scale and shadow transitions
- Error handling with placeholder fallback
- Keyboard navigation support
- ARIA labels for accessibility

### usePrefersReducedMotion Hook

**Purpose**: Custom hook to detect user's motion preference.

```typescript
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}
```

## Data Models

### BraidingStyle Type

```typescript
type BraidingStyleCategory = 
  | 'box_braids' 
  | 'knotless' 
  | 'cornrows' 
  | 'locs' 
  | 'twists' 
  | 'kids';

interface BraidingStyle {
  id: string;                    // Unique identifier
  src: string;                   // Image path relative to public directory
  alt: string;                   // Descriptive alt text for accessibility
  style: BraidingStyleCategory;  // Category for filtering/organization
  title: string;                 // Display title
}
```

### Image Asset Requirements

```typescript
interface ImageAssetRequirements {
  directory: '/public/images/braiding-styles/';
  formats: ['webp', 'jpeg'];
  maxFileSize: 500; // KB
  namingPattern: RegExp; // /^[a-z-]+-\d+\.(webp|jpg|jpeg)$/
  dimensions: {
    width: number;   // Recommended: 800px
    height: number;  // Recommended: 600px
    aspectRatio: '4:3';
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Background animator loops continuously

*For any* sequence of background images, after displaying the last image, the animator should return to the first image and continue the cycle indefinitely.

**Validates: Requirements 2.6**

### Property 2: Images maintain aspect ratio across viewports

*For any* viewport size, all braiding style images should preserve their original aspect ratio without distortion.

**Validates: Requirements 3.4**

### Property 3: Image assets conform to format requirements

*For any* image asset in the braiding-styles directory, the file format should be either WebP or JPEG.

**Validates: Requirements 5.2**

### Property 4: Image assets respect size constraints

*For any* image asset in the braiding-styles directory, the file size should not exceed 500KB.

**Validates: Requirements 5.3**

### Property 5: Image filenames follow naming convention

*For any* image asset in the braiding-styles directory, the filename should follow the pattern `{style-name}-{number}.{extension}` where style-name contains only lowercase letters and hyphens.

**Validates: Requirements 5.4**

### Property 6: All images include descriptive alt text

*For any* braiding style image rendered in the gallery or background animator, the image element should include an alt attribute with descriptive text about the braiding style.

**Validates: Requirements 7.1**

## Error Handling

### Image Loading Failures

**Scenario**: Image asset fails to load due to missing file or network error.

**Handling Strategy**:
```typescript
const [imageError, setImageError] = useState(false);

<Image
  src={src}
  alt={alt}
  onError={() => setImageError(true)}
  // ... other props
/>

{imageError && (
  <div className="fallback-placeholder">
    <span>{title}</span>
  </div>
)}
```

**User Experience**: Display a styled placeholder with the braiding style name and a generic icon.

### Missing Image Assets

**Scenario**: Required image files are not present in the public directory.

**Handling Strategy**:
- Use TypeScript to ensure image paths are validated at build time
- Implement fallback array of guaranteed images
- Log warnings in development mode for missing assets

### Animation Performance Issues

**Scenario**: Device has limited resources causing janky animations.

**Handling Strategy**:
- Use CSS transforms and opacity (GPU-accelerated properties)
- Respect `prefers-reduced-motion` to disable animations
- Implement `will-change` CSS property sparingly
- Use `requestAnimationFrame` for smooth transitions if needed

### Accessibility Failures

**Scenario**: Screen reader cannot interpret gallery content.

**Handling Strategy**:
- Ensure all images have meaningful alt text
- Add ARIA labels to gallery container: `aria-label="Braiding styles gallery"`
- Make gallery keyboard navigable with proper focus management
- Provide skip link to bypass gallery if needed

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on specific component behaviors, edge cases, and integration points. We'll use React Testing Library for component testing and Jest for assertions.

**Key Unit Test Cases**:

1. **Gallery Component Rendering**
   - Verify minimum 6 images are rendered
   - Verify specific style categories are present (box braids, knotless, cornrows, locs, twists, kids)
   - Verify section heading exists
   - Verify gallery is positioned correctly in DOM order

2. **Background Animator Timing**
   - Verify each image displays for 5 seconds
   - Verify transition completes within 1 second
   - Verify animator cycles through at least 3 images

3. **Responsive Breakpoints**
   - Verify single column layout at <640px viewport
   - Verify 2-column layout at 640-1024px viewport
   - Verify 3-column layout at >1024px viewport

4. **Design System Consistency**
   - Verify Tailwind color classes are used (primary, secondary, accent)
   - Verify rounded corners match other sections
   - Verify spacing/padding matches other sections
   - Verify shadow effects are applied

5. **Image Optimization**
   - Verify Next.js Image component is used (not img tags)
   - Verify lazy loading is enabled for below-fold images
   - Verify images have width/height to prevent layout shift
   - Verify responsive image sizes are configured

6. **Error Handling**
   - Verify placeholder displays when image fails to load
   - Verify placeholder includes braiding style name

7. **Accessibility**
   - Verify keyboard navigation works
   - Verify ARIA labels are present
   - Verify reduced motion preference disables animations
   - Verify overlay ensures text readability in hero

8. **Image Asset Organization**
   - Verify image paths reference `/public/images/braiding-styles/` directory

### Property-Based Testing Approach

Property tests will verify universal behaviors across all inputs using a property-based testing library. We'll use `fast-check` for JavaScript/TypeScript property-based testing with a minimum of 100 iterations per test.

**Property Test Configuration**:
```typescript
import fc from 'fast-check';

// Run each property test with 100 iterations
const testConfig = { numRuns: 100 };
```

**Property Test Cases**:

1. **Property 1: Background animator loops continuously**
   ```typescript
   // Feature: homepage-braiding-styles-gallery, Property 1: Background animator loops continuously
   fc.assert(
     fc.property(
       fc.array(fc.string(), { minLength: 3, maxLength: 10 }),
       (images) => {
         // Simulate advancing through all images plus one
         // Verify we're back at the first image
       }
     ),
     testConfig
   );
   ```

2. **Property 2: Images maintain aspect ratio across viewports**
   ```typescript
   // Feature: homepage-braiding-styles-gallery, Property 2: Images maintain aspect ratio across viewports
   fc.assert(
     fc.property(
       fc.integer({ min: 320, max: 2560 }), // viewport width
       fc.integer({ min: 568, max: 1440 }), // viewport height
       (width, height) => {
         // Render component at viewport size
         // Calculate aspect ratio of rendered images
         // Verify matches original aspect ratio
       }
     ),
     testConfig
   );
   ```

3. **Property 3: Image assets conform to format requirements**
   ```typescript
   // Feature: homepage-braiding-styles-gallery, Property 3: Image assets conform to format requirements
   fc.assert(
     fc.property(
       fc.constantFrom(...getAllImagePaths()),
       (imagePath) => {
         const extension = imagePath.split('.').pop()?.toLowerCase();
         return extension === 'webp' || extension === 'jpg' || extension === 'jpeg';
       }
     ),
     testConfig
   );
   ```

4. **Property 4: Image assets respect size constraints**
   ```typescript
   // Feature: homepage-braiding-styles-gallery, Property 4: Image assets respect size constraints
   fc.assert(
     fc.property(
       fc.constantFrom(...getAllImagePaths()),
       (imagePath) => {
         const stats = fs.statSync(path.join(process.cwd(), 'public', imagePath));
         const sizeInKB = stats.size / 1024;
         return sizeInKB <= 500;
       }
     ),
     testConfig
   );
   ```

5. **Property 5: Image filenames follow naming convention**
   ```typescript
   // Feature: homepage-braiding-styles-gallery, Property 5: Image filenames follow naming convention
   fc.assert(
     fc.property(
       fc.constantFrom(...getAllImagePaths()),
       (imagePath) => {
         const filename = path.basename(imagePath);
         const pattern = /^[a-z-]+-\d+\.(webp|jpg|jpeg)$/;
         return pattern.test(filename);
       }
     ),
     testConfig
   );
   ```

6. **Property 6: All images include descriptive alt text**
   ```typescript
   // Feature: homepage-braiding-styles-gallery, Property 6: All images include descriptive alt text
   fc.assert(
     fc.property(
       fc.constantFrom(...braidingStyles),
       (style) => {
         const { container } = render(<GalleryImage {...style} />);
         const img = container.querySelector('img');
         return img?.alt && img.alt.length > 0 && img.alt.trim() !== '';
       }
     ),
     testConfig
   );
   ```

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **fast-check**: Property-based testing library
- **@testing-library/user-event**: User interaction simulation
- **jest-axe**: Accessibility testing

### Test Coverage Goals

- Unit test coverage: >80% for new components
- Property test iterations: 100 per property
- All acceptance criteria mapped to at least one test
- All error handling paths tested

