'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

/**
 * RoleBasedRedirect Component
 * 
 * Automatically redirects users to their appropriate dashboard based on role:
 * - braider → /braider/dashboard
 * - customer → /dashboard
 * - admin → /admin
 * 
 * This runs after auth initialization to ensure users see the right dashboard
 */
export function RoleBasedRedirect() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { user, loading } = useSupabaseAuthStore();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Don't redirect if no user
    if (!user) return;

    // List of paths where we should NOT redirect (public pages, auth pages, etc.)
    const noRedirectPaths = [
      '/login',
      '/signup',
      '/signup/customer',
      '/signup/braider',
      '/signup/admin',
      '/search',
      '/premium',
      '/braider/',
      '/terms',
      '/privacy',
    ];

    // Check if current path is a public/auth path
    const isPublicPath = noRedirectPaths.some(path => pathname?.startsWith(path));
    
    // If on a public path, don't redirect
    if (isPublicPath) return;

    // If on homepage, redirect based on role
    if (pathname === '/') {
      if (user.role === 'braider') {
        router.push('/braider/dashboard');
      } else if (user.role === 'customer') {
        router.push('/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin');
      }
      return;
    }

    // If user is on a dashboard that doesn't match their role, redirect
    if (user.role === 'braider' && !pathname?.startsWith('/braider')) {
      // Braider on non-braider page - redirect to braider dashboard
      if (!pathname?.startsWith('/search') && !pathname?.startsWith('/premium') && !pathname?.startsWith('/braider/')) {
        router.push('/braider/dashboard');
      }
    } else if (user.role === 'customer' && pathname?.startsWith('/braider')) {
      // Customer on braider page - redirect to customer dashboard
      router.push('/dashboard');
    } else if (user.role === 'customer' && pathname?.startsWith('/admin')) {
      // Customer on admin page - redirect to customer dashboard
      router.push('/dashboard');
    } else if (user.role === 'admin' && !pathname?.startsWith('/admin')) {
      // Admin on non-admin page - redirect to admin dashboard
      if (!pathname?.startsWith('/search') && !pathname?.startsWith('/premium')) {
        router.push('/admin');
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
