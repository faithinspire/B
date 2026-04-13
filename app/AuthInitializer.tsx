'use client';

import { useEffect } from 'react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useSupabaseBraiderStore } from '@/store/supabaseBraiderStore';
import { useRoleVerification } from '@/app/hooks/useRoleVerification';

export function AuthInitializer() {
  // Verify role on app initialization
  useRoleVerification();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const authStore = useSupabaseAuthStore.getState();
        await authStore.initializeSession();

        const user = useSupabaseAuthStore.getState().user;

        if (user?.role === 'braider') {
          const braiderStore = useSupabaseBraiderStore.getState();
          await braiderStore.initializeStore();
        }

        // Fire-and-forget IP tracking — don't block auth init
        if (user) {
          fetch('/api/user/ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          }).catch(() => {});
        }
      } catch (error) {
        // silent fail — don't crash the app
      }
    };

    initializeApp();
  }, []);

  return null;
}
