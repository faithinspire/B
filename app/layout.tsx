import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { AuthInitializer } from './AuthInitializer';
import { Navigation } from './components/Navigation';
import { BackgroundImageProvider } from './components/BackgroundImageProvider';
import './globals.css';

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
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
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
      <body className="font-sans bg-white text-gray-900">
        <BackgroundImageProvider>
          <AuthInitializer />
          <Navigation />
          {children}
        </BackgroundImageProvider>
      </body>
    </html>
  );
}
