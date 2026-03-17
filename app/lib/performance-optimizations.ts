// Performance Optimizations for Braidly App

// 1. Image Optimization
export const imageOptimization = {
  // Use next/image for automatic optimization
  priority: false, // Lazy load by default
  quality: 75, // Reduce quality for faster loading
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
};

// 2. Debounce function for search and filters
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 3. Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 4. Memoization helper
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// 5. Lazy load components
export const lazyLoadComponent = (
  importFunc: () => Promise<any>,
  fallback: React.ReactNode
) => {
  return {
    importFunc,
    fallback,
  };
};

// 6. Request batching for API calls
export class RequestBatcher {
  private queue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private processing = false;
  private batchSize = 5;
  private batchDelay = 100;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      if (!this.processing) {
        this.processBatch();
      }
    });
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(
        batch.map(async ({ fn, resolve, reject }) => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
      );
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }
}

// 7. Cache management
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, ttl?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl);
    } else {
      setTimeout(() => this.cache.delete(key), this.ttl);
    }
  }

  get(key: string) {
    return this.cache.get(key)?.data;
  }

  clear() {
    this.cache.clear();
  }

  has(key: string) {
    return this.cache.has(key);
  }
}

// 8. Virtual scrolling for large lists
export const virtualScrollConfig = {
  itemHeight: 80, // Adjust based on your item height
  bufferSize: 5, // Number of items to render outside viewport
  overscan: 3, // Additional items to render for smoother scrolling
};

// 9. Code splitting hints
export const codeSpittingHints = {
  // Use dynamic imports for heavy components
  // import dynamic from 'next/dynamic';
  // const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  //   loading: () => <div>Loading...</div>,
  //   ssr: false,
  // });
};

// 10. Performance monitoring
export class PerformanceMonitor {
  static markStart(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  }

  static markEnd(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      try {
        window.performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = window.performance.getEntriesByName(name)[0];
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (e) {
        console.error(`Failed to measure ${name}:`, e);
      }
    }
  }

  static logMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      const metrics = window.performance.getEntriesByType('measure');
      console.table(metrics.map(m => ({ name: m.name, duration: m.duration.toFixed(2) })));
    }
  }
}

// 11. Network optimization
export const networkOptimization = {
  // Use compression
  compression: 'gzip',
  // Reduce bundle size
  minify: true,
  // Enable caching
  caching: true,
  // Use CDN for static assets
  cdn: true,
};

// 12. CSS optimization
export const cssOptimization = {
  // Use CSS-in-JS for critical styles
  criticalCSS: true,
  // Defer non-critical CSS
  deferCSS: true,
  // Minimize CSS
  minify: true,
};

// 13. JavaScript optimization
export const jsOptimization = {
  // Tree shaking
  treeShaking: true,
  // Code splitting
  codeSplitting: true,
  // Minification
  minify: true,
  // Compression
  compression: 'gzip',
};

// 14. Responsive image loading
export function getResponsiveImageSrc(baseUrl: string, width: number): string {
  // Adjust image size based on device width
  const sizes = [320, 640, 960, 1280, 1920];
  const closestSize = sizes.reduce((prev, curr) =>
    Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
  );
  return `${baseUrl}?w=${closestSize}`;
}

// 15. Prefetch critical resources
export function prefetchResource(url: string, as: 'script' | 'style' | 'image' = 'script') {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  }
}

// 16. Preload critical resources
export function preloadResource(url: string, as: 'script' | 'style' | 'image' = 'script') {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  }
}

// 17. Service Worker optimization
export const serviceWorkerConfig = {
  // Cache strategies
  cacheStrategies: {
    // Cache first, fallback to network
    cacheFirst: 'cache-first',
    // Network first, fallback to cache
    networkFirst: 'network-first',
    // Stale while revalidate
    staleWhileRevalidate: 'stale-while-revalidate',
  },
  // Cache duration
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
};

// 18. Database query optimization
export const dbOptimization = {
  // Use indexes
  indexes: true,
  // Batch queries
  batchQueries: true,
  // Cache results
  cacheResults: true,
  // Limit results
  limit: 50,
  // Pagination
  pagination: true,
};

// 19. API optimization
export const apiOptimization = {
  // Request timeout
  timeout: 10000,
  // Retry logic
  retries: 3,
  // Exponential backoff
  backoff: true,
  // Request deduplication
  deduplication: true,
};

// 20. Memory optimization
export const memoryOptimization = {
  // Garbage collection
  gc: true,
  // Memory pooling
  pooling: true,
  // Weak references
  weakReferences: true,
};
