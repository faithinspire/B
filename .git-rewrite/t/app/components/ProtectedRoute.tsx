'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'braider' | 'customer' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useSupabaseAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to initialize
    const checkAuth = async () => {
      // Give auth store time to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentUser = useSupabaseAuthStore.getState().user;

      if (!currentUser) {
        router.push('/login');
        return;
      }

      if (requiredRole && currentUser.role !== requiredRole) {
        router.push('/');
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [router, requiredRole]);

  // Show loading while checking auth
  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have required role, don't render
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // If no user, don't render
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
