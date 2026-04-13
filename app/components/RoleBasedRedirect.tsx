'use client';

import { useEffect, useRef } from 'react';
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
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Don't redirect while loading
    if (loading) {
      console.log('=== ROLE REDIRECT: Still loading ===');
      return;
    }

    // Don't redirect if no user
    if (!user) {
      console.log('=== ROLE REDIRECT: No user, clearing redirect flag ===');
      redirectAttempted.current = false;
      return;
    }

    console.log('=== ROLE REDIRECT: Checking redirect ===', { role: user.role, pathname, redirectAttempted: redirectAttempted.current });

    // List of paths where we should NOT redirect (public pages, auth pages, etc.)
    const noRedirectPaths = [
      '/login',
      '/signup',
      '/signup/customer',
      '/signup/braider',
      '/signup/admin',
      '/search',
      '/premium',
      '/terms',
      '/privacy',
      '/braider/', // Allow viewing other braider profiles
    ];

    // Check if current path is a public/auth path
    const isPublicPath = noRedirectPaths.some(path => pathname?.startsWith(path));
    
    // If on a public path, don't redirect
    if (isPublicPath) {
      console.log('=== ROLE REDIRECT: On public path, skipping redirect ===', { pathname });
      return;
    }

    // If on homepage, redirect based on role
    if (pathname === '/') {
      if (!redirectAttempted.current) {
        redirectAttempted.current = true;
        console.log('=== ROLE REDIRECT: On homepage, redirecting based on role ===', { role: user.role });
        if (user.role === 'braider') {
          console.log('=== ROLE REDIRECT: Redirecting braider to /braider/dashboard ===');
          router.push('/braider/dashboard');
        } else if (user.role === 'customer') {
          console.log('=== ROLE REDIRECT: Redirecting customer to /dashboard ===');
          router.push('/dashboard');
        } else if (user.role === 'admin') {
          console.log('=== ROLE REDIRECT: Redirecting admin to /admin ===');
          router.push('/admin');
        }
      }
      return;
    }

    // If user is on a dashboard that doesn't match their role, redirect
    if (user.role === 'braider' && !pathname?.startsWith('/braider')) {
      // Braider on non-braider page - redirect to braider dashboard
      if (!pathname?.startsWith('/search') && !pathname?.startsWith('/premium')) {
        console.log('=== ROLE REDIRECT: Braider on non-braider page, redirecting ===', { pathname });
        router.push('/braider/dashboard');
      }
    } else if (user.role === 'customer' && pathname?.startsWith('/braider/dashboard')) {
      // Customer on braider dashboard - redirect to customer dashboard
      console.log('=== ROLE REDIRECT: Customer on braider dashboard, redirecting ===');
      router.push('/dashboard');
    } else if (user.role === 'customer' && pathname?.startsWith('/admin')) {
      // Customer on admin page - redirect to customer dashboard
      console.log('=== ROLE REDIRECT: Customer on admin page, redirecting ===');
      router.push('/dashboard');
    } else if (user.role === 'admin' && !pathname?.startsWith('/admin')) {
      // Admin on non-admin page - redirect to admin dashboard
      if (!pathname?.startsWith('/search') && !pathname?.startsWith('/premium')) {
        console.log('=== ROLE REDIRECT: Admin on non-admin page, redirecting ===', { pathname });
        router.push('/admin');
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
