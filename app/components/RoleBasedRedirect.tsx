'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

/**
 * HARD FIX: Clean role-based redirect with NO race conditions
 * 
 * Rules:
 * - braider role → /braider/dashboard
 * - customer role → /dashboard
 * - admin role → /admin
 * - No shared routes between roles
 */
export function RoleBasedRedirect() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { user, loading } = useSupabaseAuthStore();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // No user = no redirect
    if (!user) return;

    // Public paths - never redirect
    const publicPaths = ['/login', '/signup', '/signup/customer', '/signup/braider', '/search', '/terms', '/privacy'];
    if (publicPaths.some(p => pathname.startsWith(p))) return;

    // Homepage - redirect based on role
    if (pathname === '/') {
      if (user.role === 'braider') router.push('/braider/dashboard');
      else if (user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
      return;
    }

    // ENFORCE ROLE-BASED ROUTING
    const isBraiderRoute = pathname.startsWith('/braider');
    const isCustomerRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/booking') || pathname.startsWith('/favorites') || pathname.startsWith('/notifications') || pathname.startsWith('/profile') || pathname.startsWith('/referrals') || pathname.startsWith('/messages');
    const isAdminRoute = pathname.startsWith('/admin');

    // Braider on wrong route
    if (user.role === 'braider' && !isBraiderRoute) {
      router.push('/braider/dashboard');
      return;
    }

    // Customer on wrong route
    if (user.role === 'customer' && (isBraiderRoute || isAdminRoute)) {
      router.push('/dashboard');
      return;
    }

    // Admin on wrong route
    if (user.role === 'admin' && !isAdminRoute) {
      router.push('/admin');
      return;
    }
  }, [user, loading, pathname, router]);

  return null;
}
