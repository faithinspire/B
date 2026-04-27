'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

/**
 * FIXED: Role-based redirect that does NOT block homepage or public pages.
 *
 * Rules:
 * - Homepage (/) is ALWAYS accessible to everyone — no redirect
 * - Public pages (/search, /marketplace, /braider/[id], etc.) are accessible to all
 * - Only redirect when a user is on a WRONG role-specific dashboard
 * - Never redirect from shared/public routes
 */
export function RoleBasedRedirect() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { user, loading } = useSupabaseAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // ─── NEVER redirect from these paths ───────────────────────────────────
    // Homepage, public pages, auth pages, shared pages
    const neverRedirectPaths = [
      '/',
      '/login',
      '/signup',
      '/signup/customer',
      '/signup/braider',
      '/signup/barber',
      '/signup/admin',
      '/search',
      '/marketplace',
      '/premium',
      '/terms',
      '/privacy',
    ];

    // Check exact match or prefix match for public paths
    const isNeverRedirect =
      neverRedirectPaths.includes(pathname) ||
      pathname.startsWith('/braider/') ||   // public braider profiles
      pathname.startsWith('/marketplace/') || // product pages
      pathname.startsWith('/premium/');

    if (isNeverRedirect) return;

    // ─── Role-specific route enforcement ───────────────────────────────────
    const isBraiderDashRoute = pathname.startsWith('/braider/dashboard') ||
      pathname.startsWith('/braider/bookings') ||
      pathname.startsWith('/braider/messages') ||
      pathname.startsWith('/braider/portfolio') ||
      pathname.startsWith('/braider/services') ||
      pathname.startsWith('/braider/marketplace') ||
      pathname.startsWith('/braider/wallet') ||
      pathname.startsWith('/braider/verify') ||
      pathname.startsWith('/braider/calendar') ||
      pathname.startsWith('/braider/blog') ||
      pathname.startsWith('/braider/status') ||
      pathname.startsWith('/braider/premium');

    const isCustomerRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/booking') ||
      pathname.startsWith('/favorites') ||
      pathname.startsWith('/notifications') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/referrals') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/orders');

    const isAdminRoute = pathname.startsWith('/admin');

    // Braider trying to access customer-only routes
    if (user.role === 'braider' && isCustomerRoute) {
      router.push('/braider/dashboard');
      return;
    }

    // Braider trying to access admin routes
    if (user.role === 'braider' && isAdminRoute) {
      router.push('/braider/dashboard');
      return;
    }

    // Customer trying to access braider dashboard routes
    if (user.role === 'customer' && isBraiderDashRoute) {
      router.push('/dashboard');
      return;
    }

    // Customer trying to access admin routes
    if (user.role === 'customer' && isAdminRoute) {
      router.push('/dashboard');
      return;
    }

    // Admin trying to access role-specific routes
    if (user.role === 'admin' && (isBraiderDashRoute || isCustomerRoute)) {
      router.push('/admin');
      return;
    }
  }, [user, loading, pathname, router]);

  return null;
}
