import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { AuthInitializer } from './AuthInitializer';
import { Navigation } from './components/Navigation';
import { PageBackground } from './components/PageBackground';
import { AIAssistant } from './components/AIAssistant';
import './globals.css';

// Force dynamic rendering for all routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  title: 'Braidly - Premium Braiding Marketplace',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans bg-transparent text-gray-900">
        <PageBackground />
        <AuthInitializer />
        <AIAssistant />
        
        {/* Fixed container that holds everything */}
        <div className="fixed inset-0 flex flex-col" style={{ margin: 0, padding: 0 }}>
          {/* Fixed Navigation at top */}
          <div className="flex-shrink-0">
            <Navigation />
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ margin: 0, padding: 0 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
