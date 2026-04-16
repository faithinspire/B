'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

export default function BraiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useSupabaseAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user is not a braider, redirect to appropriate dashboard
    if (user.role !== 'braider') {
      console.log('=== BRAIDER LAYOUT: User is not a braider, redirecting ===', { role: user.role });
      
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    // User is a braider, allow access
    setIsAuthorized(true);
  }, [user, loading, router]);

  // Show nothing while loading or if not authorized
  if (loading || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
