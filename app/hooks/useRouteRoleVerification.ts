import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

/**
 * Hook to verify role when route changes
 * Ensures user has correct role for the route they're accessing
 */
export function useRouteRoleVerification() {
  const pathname = usePathname();
  const { user } = useSupabaseAuthStore();

  useEffect(() => {
    if (!user?.id || !pathname) return;

    // Check if user is on a route that doesn't match their role
    const isBraiderRoute = pathname.startsWith('/braider');
    const isAdminRoute = pathname.startsWith('/admin');
    const isCustomerRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/messages') || pathname.startsWith('/booking') || pathname.startsWith('/favorites') || pathname.startsWith('/notifications') || pathname.startsWith('/profile') || pathname.startsWith('/referrals');

    // If user is on a route that doesn't match their role, verify
    let shouldVerify = false;

    if (isBraiderRoute && user.role !== 'braider') {
      console.log('=== ROUTE VERIFICATION: User on braider route but role is', user.role);
      shouldVerify = true;
    } else if (isAdminRoute && user.role !== 'admin') {
      console.log('=== ROUTE VERIFICATION: User on admin route but role is', user.role);
      shouldVerify = true;
    } else if (isCustomerRoute && user.role !== 'customer') {
      console.log('=== ROUTE VERIFICATION: User on customer route but role is', user.role);
      shouldVerify = true;
    }

    if (!shouldVerify) return;

    // Verify role
    const verifyRole = async () => {
      try {
        console.log('=== ROUTE VERIFICATION: Verifying role for route', pathname);

        const response = await fetch('/api/auth/verify-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          console.warn('=== ROUTE VERIFICATION: Verification failed ===', response.status);
          return;
        }

        const data = await response.json();
        console.log('=== ROUTE VERIFICATION: Result ===', data);

        // If role was updated, update the store
        if (data.action === 'updated' && data.newRole && data.newRole !== user.role) {
          console.log('=== ROUTE VERIFICATION: Role was updated ===', { 
            oldRole: user.role, 
            newRole: data.newRole 
          });
          useSupabaseAuthStore.setState({
            user: { ...user, role: data.newRole as 'customer' | 'braider' | 'admin' }
          });
        }
      } catch (error) {
        console.warn('=== ROUTE VERIFICATION: Error ===', error instanceof Error ? error.message : error);
      }
    };

    verifyRole();
  }, [pathname, user?.id, user?.role]);
}
