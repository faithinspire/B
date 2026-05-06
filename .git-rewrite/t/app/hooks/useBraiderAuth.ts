import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

export function useBraiderAuth() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check if user is authenticated and is a braider
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'braider') {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  return {
    user,
    authLoading,
    isAuthorized: !authLoading && user && user.role === 'braider',
  };
}
