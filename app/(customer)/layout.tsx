'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useSupabaseAuthStore();

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user is a braider, redirect to braider dashboard
    if (user.role === 'braider') {
      console.log('=== CUSTOMER LAYOUT: User is a braider, redirecting to braider dashboard ===');
      router.push('/braider/dashboard');
      return;
    }

    // If user is admin, redirect to admin dashboard
    if (user.role === 'admin') {
      console.log('=== CUSTOMER LAYOUT: User is admin, redirecting to admin dashboard ===');
      router.push('/admin');
      return;
    }
  }, [user, loading, router]);

  // Show nothing while loading or if user is not a customer
  if (loading || !user || (user.role !== 'customer' && user.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
