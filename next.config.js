/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // avoid double renders on mobile
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'gymgxcspjysrkluxyavd.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // Allow all domains for img tags (not Next/Image) — no restriction needed
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', 'recharts', '@stripe/react-stripe-js'],
    missingSuspenseWithCSRBailout: false,
  },
  // Skip generating error pages during build
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Skip prerendering problematic pages
  skipTrailingSlashRedirect: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Disable static generation for protected routes
  staticPageGenerationTimeout: 0,
};

module.exports = nextConfig;
