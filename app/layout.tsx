import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import dynamic from 'next/dynamic';
import { AuthInitializer } from './AuthInitializer';
import { Navigation } from './components/Navigation';
import { ServiceWorkerRegister } from './components/ServiceWorkerRegister';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import './globals.css';
import './styles/apple-design.css';

// Lazy load heavy components — not needed on initial paint
const AIAssistant = dynamic(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })), {
  ssr: false,
  loading: () => null,
});

const PageBackground = dynamic(() => import('./components/PageBackground').then(m => ({ default: m.PageBackground })), {
  ssr: false,
  loading: () => null,
});

const AppInitializer = dynamic(() => import('./components/AppInitializer').then(m => ({ default: m.AppInitializer })), {
  ssr: false,
  loading: () => null,
});

const PWAInstallPrompt = dynamic(() => import('./components/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })), {
  ssr: false,
  loading: () => null,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'BraidMe - Premium Braiding Marketplace',
  description: 'Connect with verified braiders for premium braiding services',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <meta name="theme-color" content="#9333ea" />
        <meta name="description" content="Connect with verified braiders for premium braiding services" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BraidMe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="BraidMe" />
        <meta name="msapplication-TileColor" content="#9333ea" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans bg-transparent text-gray-900">
        <PageBackground />
        <AuthInitializer />
        <RoleBasedRedirect />
        <ServiceWorkerRegister />
        <AppInitializer />
        <AIAssistant />
        <PWAInstallPrompt />
        
        {/* Fixed container that holds everything */}
        <div className="min-h-screen flex flex-col" style={{ margin: 0, padding: 0 }}>
          {/* Fixed Navigation at top */}
          <div className="flex-shrink-0 sticky top-0 z-50">
            <Navigation />
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1" style={{ margin: 0, padding: 0 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
