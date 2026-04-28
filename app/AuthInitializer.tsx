'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuthStore, initializeAuthStore } from '@/store/supabaseAuthStore';
import { useSupabaseBraiderStore } from '@/store/supabaseBraiderStore';
import { useRoleVerification } from '@/app/hooks/useRoleVerification';

export function AuthInitializer() {
  const [roleVerified, setRoleVerified] = useState(false);

  // Verify role on app initialization
  useRoleVerification();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // PHASE 2: Initialize auth store with session recovery
        await initializeAuthStore();

        const user = useSupabaseAuthStore.getState().user;

        // Verify role immediately after session initialization
        if (user?.id) {
          try {
            console.log('=== AUTH INITIALIZER: Verifying role after session init ===', { userId: user.id, role: user.role });
            
            const response = await fetch('/api/auth/verify-role', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('=== AUTH INITIALIZER: Role verification result ===', data);

              // If role was updated, update the store
              if (data.action === 'updated' && data.newRole && data.newRole !== user.role) {
                console.log('=== AUTH INITIALIZER: Updating role ===', { oldRole: user.role, newRole: data.newRole });
                useSupabaseAuthStore.setState({
                  user: { ...user, role: data.newRole as 'customer' | 'braider' | 'admin' }
                });
              }
            }
          } catch (err) {
            console.warn('=== AUTH INITIALIZER: Role verification failed ===', err);
          }
        }

        // Mark role as verified so RoleBasedRedirect can proceed
        setRoleVerified(true);

        const updatedUser = useSupabaseAuthStore.getState().user;

        if (updatedUser?.role === 'braider') {
          const braiderStore = useSupabaseBraiderStore.getState();
          await braiderStore.initializeStore();
        }

        // Fire-and-forget IP tracking — don't block auth init
        if (updatedUser) {
          fetch('/api/user/ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: updatedUser.id }),
          }).catch(() => {});
        }
      } catch (error) {
        // silent fail — don't crash the app
        console.error('=== AUTH INITIALIZER: Error ===', error);
        setRoleVerified(true); // Still mark as verified to unblock the app
      }
    };

    initializeApp();
  }, []);

  return null;
}
