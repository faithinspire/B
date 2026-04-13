import { useEffect } from 'react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

/**
 * Hook to verify and fix user role
 * Runs on app initialization to ensure role is correct
 */
export function useRoleVerification() {
  const { user } = useSupabaseAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    const verifyRole = async () => {
      try {
        console.log('=== ROLE VERIFICATION: Verifying user role ===', { userId: user.id, currentRole: user.role });

        const response = await fetch('/api/auth/verify-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          console.warn('=== ROLE VERIFICATION: Verification failed ===', response.status);
          return;
        }

        const data = await response.json();
        console.log('=== ROLE VERIFICATION: Result ===', data);

        // If role was updated, update the store
        if (data.action === 'updated' && data.newRole && data.newRole !== user.role) {
          console.log('=== ROLE VERIFICATION: Role was updated, updating store ===', { 
            oldRole: user.role, 
            newRole: data.newRole 
          });
          useSupabaseAuthStore.setState({
            user: { ...user, role: data.newRole as 'customer' | 'braider' | 'admin' }
          });
        }
      } catch (error) {
        console.warn('=== ROLE VERIFICATION: Error ===', error instanceof Error ? error.message : error);
        // Silent fail - don't block app
      }
    };

    // Verify role on mount
    verifyRole();

    // Also verify every 5 minutes to catch any changes
    const interval = setInterval(verifyRole, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);
}
