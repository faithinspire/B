'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraidMeLogo } from './BraidMeLogo';
import { Menu, X, LogOut, Home, MessageSquare, Zap, ShoppingBag, DollarSign, MessageCircle, Users, LayoutDashboard } from 'lucide-react';

const BACKGROUND_IMAGES = [
  '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png',
  '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png',
  '/images/braiding-styles/b_Professional_photo_o.png',
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useSupabaseAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const isActive = (path: string) => pathname === path || (pathname?.startsWith(path + '/') ?? false);

  const getBottomNavItems = () => {
    if (!user) return [];

    if (user.role === 'customer') {
      return [
        { href: '/', icon: Home, label: 'Home', emoji: '🏠' },
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
        { href: '/booking', icon: Zap, label: 'Book', emoji: '⚡' },
        { href: '/marketplace', icon: ShoppingBag, label: 'Shop', emoji: '🛍️' },
        { href: '/messages', icon: MessageSquare, label: 'Messages', emoji: '💬' },
      ];
    }

    if (user.role === 'braider') {
      return [
        { href: '/', icon: Home, label: 'Home', emoji: '🏠' },
        { href: '/braider/dashboard', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
        { href: '/braider/bookings', icon: Zap, label: 'Bookings', emoji: '📅' },
        { href: '/braider/messages', icon: MessageSquare, label: 'Messages', emoji: '💬' },
        { href: '/braider/marketplace', icon: ShoppingBag, label: 'Store', emoji: '🏪' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { href: '/', icon: Home, label: 'Home', emoji: '🏠' },
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
        { href: '/admin/users', icon: Users, label: 'Users', emoji: '👥' },
        { href: '/admin/payments', icon: DollarSign, label: 'Payments', emoji: '💰' },
        { href: '/admin/conversations', icon: MessageCircle, label: 'Chats', emoji: '💬' },
      ];
    }

    return [];
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <>
      {/* Top Navigation - Remove sticky, it's now in a fixed container */}
      <nav className="bg-white border-b border-gray-200 shadow-sm z-40" style={{ margin: 0, padding: 0 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <BraidMeLogo size="sm" showText={true} />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {!user ? (
                <>
                  <Link href="/" className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors font-medium">
                    Home
                  </Link>
                  <Link href="/search" className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors font-medium">
                    Browse
                  </Link>
                  <Link href="/marketplace" className="px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors font-medium flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" /> Shop
                  </Link>
                  <Link href="/premium" className="px-4 py-2 text-yellow-600 hover:text-yellow-700 transition-colors font-medium flex items-center gap-1">
                    <span>👑</span> Premium
                  </Link>
                  <Link href="/login" className="ml-4 px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/" className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors font-medium">
                    Home
                  </Link>
                  <Link href="/search" className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors font-medium">
                    Browse
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="ml-4 px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 font-semibold"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-primary-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-50 overflow-y-auto overscroll-contain">
            {/* Animated Background */}
            <div className="absolute inset-0">
              {BACKGROUND_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: idx === currentImageIndex ? 0.15 : 0,
                  }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-purple-50 to-pink-50" />
            </div>

            {/* Menu Content */}
            <div className="relative min-h-full">
              <div className="p-4 space-y-2 pb-32">
                {!user ? (
                  <>
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl font-semibold text-gray-900 hover:bg-white/80 transition-all duration-300 backdrop-blur-sm"
                    >
                      Home
                    </Link>
                    <Link
                      href="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl font-semibold text-gray-900 hover:bg-white/80 transition-all duration-300 backdrop-blur-sm"
                    >
                      Browse Braiders
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-bold text-center"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm mb-4">
                      <p className="text-sm text-gray-600">Welcome back!</p>
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                    </div>

                    {bottomNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm ${
                          isActive(item.href)
                            ? 'bg-white text-primary-600 shadow-md'
                            : 'text-gray-900 hover:bg-white/80'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 font-bold backdrop-blur-sm mt-4"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation Bar - Mobile Only, Always Visible */}
      {user && bottomNavItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl md:hidden">
          <div className="flex items-center justify-around h-20 px-0.5 gap-0.5">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-all duration-200 flex-1 h-full min-w-0 ${
                    active
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  title={item.label}
                >
                  <span className="text-lg leading-none">{item.emoji}</span>
                  <span className="text-xs font-semibold leading-tight text-center truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
