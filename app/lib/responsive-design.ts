// Responsive Design Utilities for Braidly App

// Breakpoints
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Media queries
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
  // Mobile first
  mobileOnly: `@media (max-width: ${breakpoints.sm - 1}px)`,
  tabletOnly: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktopOnly: `@media (min-width: ${breakpoints.lg}px)`,
};

// Responsive grid utilities
export const gridLayouts = {
  // Mobile: 1 column
  mobile: 'grid-cols-1',
  // Tablet: 2 columns
  tablet: 'md:grid-cols-2',
  // Desktop: 3 columns
  desktop: 'lg:grid-cols-3',
  // Full responsive
  responsive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // 4 columns on desktop
  responsive4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

// Responsive padding
export const responsivePadding = {
  xs: 'px-3 py-2',
  sm: 'px-4 py-3',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
  xl: 'px-12 py-8',
};

// Responsive font sizes
export const responsiveFontSizes = {
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
  body: 'text-sm sm:text-base md:text-lg',
  small: 'text-xs sm:text-sm md:text-base',
};

// Responsive spacing
export const responsiveSpacing = {
  gap: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6',
  margin: 'mb-2 sm:mb-3 md:mb-4 lg:mb-6',
  padding: 'p-2 sm:p-3 md:p-4 lg:p-6',
};

// Responsive display utilities
export const responsiveDisplay = {
  // Hide on mobile, show on tablet+
  hideOnMobile: 'hidden sm:block',
  // Show on mobile, hide on tablet+
  showOnMobile: 'block sm:hidden',
  // Hide on tablet, show on desktop
  hideOnTablet: 'hidden lg:block',
  // Show on tablet, hide on desktop
  showOnTablet: 'block lg:hidden',
};

// Responsive flex utilities
export const responsiveFlex = {
  // Stack on mobile, row on desktop
  stackToRow: 'flex flex-col md:flex-row',
  // Responsive gap
  gap: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6',
};

// Responsive container
export const responsiveContainer = {
  // Full width on mobile, max-width on desktop
  container: 'w-full px-3 sm:px-4 md:px-6 lg:px-8 mx-auto max-w-7xl',
  // Smaller container
  smallContainer: 'w-full px-3 sm:px-4 md:px-6 mx-auto max-w-4xl',
  // Large container
  largeContainer: 'w-full px-3 sm:px-4 md:px-6 lg:px-8 mx-auto max-w-full',
};

// Responsive image utilities
export const responsiveImage = {
  // Responsive image wrapper
  wrapper: 'w-full h-auto aspect-video',
  // Responsive avatar
  avatar: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
  // Responsive thumbnail
  thumbnail: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
};

// Responsive button utilities
export const responsiveButton = {
  // Responsive button size
  size: 'px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3',
  // Responsive button text
  text: 'text-xs sm:text-sm md:text-base',
};

// Responsive form utilities
export const responsiveForm = {
  // Responsive input
  input: 'w-full px-3 py-2 sm:px-4 sm:py-2 md:px-4 md:py-3',
  // Responsive label
  label: 'text-xs sm:text-sm md:text-base',
  // Responsive form group
  group: 'mb-3 sm:mb-4 md:mb-6',
};

// Responsive card utilities
export const responsiveCard = {
  // Responsive card
  card: 'p-3 sm:p-4 md:p-6 rounded-lg shadow',
  // Responsive card grid
  grid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6',
};

// Responsive modal utilities
export const responsiveModal = {
  // Responsive modal
  modal: 'w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl',
  // Responsive modal padding
  padding: 'p-4 sm:p-6 md:p-8',
};

// Responsive navigation utilities
export const responsiveNavigation = {
  // Responsive navbar
  navbar: 'flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4',
  // Responsive menu
  menu: 'flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6',
};

// Responsive sidebar utilities
export const responsiveSidebar = {
  // Responsive sidebar
  sidebar: 'hidden lg:block w-64 bg-white shadow',
  // Responsive sidebar toggle
  toggle: 'lg:hidden',
};

// Responsive table utilities
export const responsiveTable = {
  // Responsive table wrapper
  wrapper: 'w-full overflow-x-auto',
  // Responsive table
  table: 'w-full text-xs sm:text-sm md:text-base',
  // Responsive table cell
  cell: 'px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4',
};

// Responsive list utilities
export const responsiveList = {
  // Responsive list
  list: 'space-y-2 sm:space-y-3 md:space-y-4',
  // Responsive list item
  item: 'p-2 sm:p-3 md:p-4 rounded border',
};

// Responsive hero utilities
export const responsiveHero = {
  // Responsive hero section
  hero: 'min-h-screen flex items-center justify-center px-3 sm:px-4 md:px-6',
  // Responsive hero title
  title: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold',
  // Responsive hero subtitle
  subtitle: 'text-lg sm:text-xl md:text-2xl text-gray-600',
};

// Responsive footer utilities
export const responsiveFooter = {
  // Responsive footer
  footer: 'px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12',
  // Responsive footer grid
  grid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8',
};

// Responsive utility function
export function getResponsiveClass(
  mobile: string,
  tablet?: string,
  desktop?: string,
  xl?: string
): string {
  const classes = [mobile];
  if (tablet) classes.push(`sm:${tablet}`);
  if (desktop) classes.push(`md:${desktop}`);
  if (xl) classes.push(`lg:${xl}`);
  return classes.join(' ');
}

// Hook for responsive values
export function useResponsiveValue<T>(
  mobileValue: T,
  tabletValue?: T,
  desktopValue?: T
): T {
  if (typeof window === 'undefined') return mobileValue;

  const width = window.innerWidth;
  if (width >= breakpoints.lg && desktopValue) return desktopValue;
  if (width >= breakpoints.md && tabletValue) return tabletValue;
  return mobileValue;
}

// Responsive image srcset
export function getResponsiveImageSrcSet(baseUrl: string): string {
  return `
    ${baseUrl}?w=320 320w,
    ${baseUrl}?w=640 640w,
    ${baseUrl}?w=960 960w,
    ${baseUrl}?w=1280 1280w,
    ${baseUrl}?w=1920 1920w
  `.trim();
}

// Responsive sizes attribute
export function getResponsiveImageSizes(): string {
  return `
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    (max-width: 1280px) 33vw,
    25vw
  `.trim();
}
