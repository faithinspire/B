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
  const verifyInProgress = useRef(false);

  useEffect(() => {
    // Don't redirect while loading
    if (loading) {
      return;
    }

    // Don't redirect if no user
    if (!user) {
      redirectAttempted.current = false;
      return;
    }

    console.log('=== ROLE REDIRECT: Checking redirect ===', { role: user.role, pathname });

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
      return;
    }

    // If on homepage, redirect based on role
    if (pathname === '/') {
      if (!redirectAttempted.current) {
        redirectAttempted.current = true;
        console.log('=== ROLE REDIRECT: On homepage, redirecting based on role ===', { role: user.role });
        
        if (user.role === 'braider') {
          router.push('/braider/dashboard');
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
      return;
    }

    // CRITICAL: Verify role is correct for the current route
    // This prevents braiders from seeing customer dashboard and vice versa
    const isOnBraiderRoute = pathname?.startsWith('/braider');
    const isOnCustomerRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/booking') || pathname?.startsWith('/favorites') || pathname?.startsWith('/notifications') || pathname?.startsWith('/profile') || pathname?.startsWith('/referrals') || pathname?.startsWith('/messages');
    const isOnAdminRoute = pathname?.startsWith('/admin');

    // If braider is on customer route, redirect to braider dashboard
    if (user.role === 'braider' && isOnCustomerRoute) {
      console.log('=== ROLE REDIRECT: Braider on customer route, redirecting to braider dashboard ===');
      router.push('/braider/dashboard');
      return;
    }

    // If customer is on braider route, redirect to customer dashboard
    if (user.role === 'customer' && isOnBraiderRoute) {
      console.log('=== ROLE REDIRECT: Customer on braider route, redirecting to customer dashboard ===');
      router.push('/dashboard');
      return;
    }

    // If customer is on admin route, redirect to customer dashboard
    if (user.role === 'customer' && isOnAdminRoute) {
      console.log('=== ROLE REDIRECT: Customer on admin route, redirecting to customer dashboard ===');
      router.push('/dashboard');
      return;
    }

    // If admin is on customer route, redirect to admin dashboard
    if (user.role === 'admin' && isOnCustomerRoute) {
      console.log('=== ROLE REDIRECT: Admin on customer route, redirecting to admin dashboard ===');
      router.push('/admin');
      return;
    }

    // If admin is on braider route, redirect to admin dashboard
    if (user.role === 'admin' && isOnBraiderRoute) {
      console.log('=== ROLE REDIRECT: Admin on braider route, redirecting to admin dashboard ===');
      router.push('/admin');
      return;
    }

    // If braider is on admin route, redirect to braider dashboard
    if (user.role === 'braider' && isOnAdminRoute) {
      console.log('=== ROLE REDIRECT: Braider on admin route, redirecting to braider dashboard ===');
      router.push('/braider/dashboard');
      return;
    }

    // Verify role periodically (every 5 minutes) to catch role changes
    const verifyKey = `role_verify_${user.id}`;
    const lastVerify = sessionStorage.getItem(verifyKey);
    const now = Date.now();
    
    if (!lastVerify || now - parseInt(lastVerify) > 300000) { // 5 minutes
      if (!verifyInProgress.current) {
        verifyInProgress.current = true;
        sessionStorage.setItem(verifyKey, now.toString());
        
        fetch('/api/auth/verify-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('=== ROLE REDIRECT: Role verification result ===', data);
            
            // If role doesn't match, update it
            if (data.correctRole && data.correctRole !== user.role) {
              console.log('=== ROLE REDIRECT: Role mismatch detected, reloading ===', { 
                currentRole: user.role, 
                correctRole: data.correctRole 
              });
              // Hard reload to ensure correct dashboard is shown
              window.location.href = '/';
            }
          })
          .catch(err => {
            console.error('=== ROLE REDIRECT: Role verification failed ===', err);
          })
          .finally(() => {
            verifyInProgress.current = false;
          });
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
