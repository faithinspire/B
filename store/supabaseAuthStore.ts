import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'customer' | 'braider' | 'admin';
  full_name: string;
  avatar_url?: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string, role: 'customer' | 'braider' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initializeSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  forceRefreshRole: () => Promise<void>;
}

export const useSupabaseAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  initializeSession: async () => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('=== AUTH STORE: Session check ===', { hasSession: !!session, userId: session?.user?.id });

      if (!session?.user) {
        console.log('=== AUTH STORE: No session, setting user to null ===');
        set({ user: null });
        return;
      }

      // Fetch user profile - CRITICAL for getting correct role
      let profile = null;
      let role = 'customer'; // Default role
      
      // Try to fetch profile with aggressive retries
      for (let i = 0; i < 15; i++) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // No rows returned - profile doesn't exist yet
              console.warn('=== AUTH STORE: Profile not found on attempt', i + 1);
              if (i < 14) {
                await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
                continue;
              }
            } else {
              throw profileError;
            }
          } else if (profileData) {
            console.log('=== AUTH STORE: Profile found ===', { role: profileData.role, email: profileData.email });
            profile = profileData;
            role = profileData.role || 'customer';
            break;
          }
        } catch (err) {
          console.warn('=== AUTH STORE: Profile fetch error on attempt', i + 1, err instanceof Error ? err.message : err);
          if (i < 14) {
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
          }
        }
      }

      // If profile still not found, check braider_profiles as fallback
      if (!profile) {
        console.log('=== AUTH STORE: Profile not found, checking braider_profiles ===');
        try {
          const { data: braiderProfile } = await supabase
            .from('braider_profiles')
            .select('user_id')
            .eq('user_id', session.user.id)
            .single();

          if (braiderProfile) {
            console.log('=== AUTH STORE: Found braider_profiles record, user is a braider ===');
            role = 'braider';
          }
        } catch (err) {
          console.warn('=== AUTH STORE: Braider profile check failed ===', err instanceof Error ? err.message : err);
        }
      }

      // CRITICAL: Get role from profile.role FIRST, then braider check, then auth metadata, then default
      const finalRole = profile?.role || role || session.user.user_metadata?.role || 'customer';
      
      console.log('=== AUTH STORE: Final role determination ===', { 
        profileRole: profile?.role,
        braiderCheckRole: role,
        authRole: session.user.user_metadata?.role,
        finalRole,
        email: session.user.email 
      });

      set({
        user: {
          id: session.user.id,
          email: session.user.email || '',
          role: finalRole as 'customer' | 'braider' | 'admin',
          full_name: profile?.full_name || session.user.user_metadata?.full_name || '',
          avatar_url: profile?.avatar_url,
        },
      });
    } catch (error) {
      console.error('=== AUTH STORE: Failed to initialize session ===', error);
      set({ error: error instanceof Error ? error.message : 'Failed to initialize session' });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, fullName, role) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Upsert profile in database (insert or update if exists)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        // If upsert fails, try to fetch existing profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!existingProfile) {
          throw profileError;
        }
      }

      set({
        user: {
          id: authData.user.id,
          email,
          role,
          full_name: fullName,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to sign in');

      console.log('=== AUTH STORE: User signed in ===', { userId: authData.user.id, email: authData.user.email });

      // Fetch user profile with aggressive retry logic
      let profile = null;
      let retries = 15; // Increased from 10 to 15 for better reliability
      
      while (retries > 0 && !profile) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 = no rows returned, which is ok
            throw profileError;
          }

          if (profileData) {
            console.log('=== AUTH STORE: Profile fetched ===', { role: profileData.role, email: profileData.email });
            profile = profileData;
            break;
          }
        } catch (err) {
          console.warn('=== AUTH STORE: Profile fetch attempt failed ===', { retries, error: err instanceof Error ? err.message : err });
          retries--;
          if (retries > 0) {
            // Exponential backoff with longer delays
            const delay = (16 - retries) * 400; // Increased delay for better reliability
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // If profile doesn't exist, create a default one with correct role from auth metadata
      if (!profile) {
        console.log('=== AUTH STORE: Profile not found, checking braider_profiles ===');
        
        // Check if user is a braider
        let isBraider = false;
        try {
          const { data: braiderProfile } = await supabase
            .from('braider_profiles')
            .select('user_id')
            .eq('user_id', authData.user.id)
            .single();

          if (braiderProfile) {
            console.log('=== AUTH STORE: Found braider_profiles record, user is a braider ===');
            isBraider = true;
          }
        } catch (err) {
          console.warn('=== AUTH STORE: Braider profile check failed ===', err instanceof Error ? err.message : err);
        }

        console.log('=== AUTH STORE: Creating default profile ===', { 
          role: isBraider ? 'braider' : (authData.user.user_metadata?.role || 'customer')
        });

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email || '',
            full_name: authData.user.user_metadata?.full_name || '',
            role: isBraider ? 'braider' : (authData.user.user_metadata?.role || 'customer'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          })
          .select()
          .single();

        if (createError) {
          console.error('=== AUTH STORE: Failed to create profile ===', createError);
        }
        profile = newProfile;
      }

      // CRITICAL: Get role from profile.role FIRST, then auth metadata, then default to customer
      const role = profile?.role || authData.user.user_metadata?.role || 'customer';

      console.log('=== AUTH STORE: Final role determination ===', { 
        profileRole: profile?.role, 
        authRole: authData.user.user_metadata?.role,
        finalRole: role,
        email: authData.user.email 
      });

      set({
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          role: role as 'customer' | 'braider' | 'admin',
          full_name: profile?.full_name || '',
          avatar_url: profile?.avatar_url,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('=== AUTH STORE: Sign in error ===', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Clear local state first
      set({ user: null });
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        // Don't throw - user is already cleared locally
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      console.error('Signout error:', errorMessage);
      // Don't throw - user is already cleared locally
    } finally {
      set({ loading: false });
    }
  },

  fetchUser: async () => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        let profile = null;
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          profile = profileData;
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }

        // Get role from profile.role first, then check braider_profiles, then auth metadata, then default to customer
        let role = profile?.role || session.user.user_metadata?.role || 'customer';

        // If role is still customer, check if user is a braider
        if (role === 'customer') {
          try {
            const { data: braiderProfile } = await supabase
              .from('braider_profiles')
              .select('user_id')
              .eq('user_id', session.user.id)
              .single();

            if (braiderProfile) {
              console.log('=== AUTH STORE: fetchUser found braider_profiles record ===');
              role = 'braider';
            }
          } catch (err) {
            // Silent fail - braider profile doesn't exist
          }
        }

        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            role: role as 'customer' | 'braider' | 'admin',
            full_name: profile?.full_name || session.user.user_metadata?.full_name || '',
            avatar_url: profile?.avatar_url,
          },
        });
      } else {
        set({ user: null });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePassword: async (newPassword) => {
    if (!supabase) {
      set({ error: 'Supabase not configured' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  forceRefreshRole: async () => {
    const { user } = useSupabaseAuthStore.getState();
    if (!user) return;

    try {
      console.log('=== AUTH STORE: Force refreshing role ===', { userId: user.id });
      
      // Call the refresh-role endpoint to get the correct role
      const response = await fetch('/api/auth/refresh-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh role');
      }

      const data = await response.json();
      console.log('=== AUTH STORE: Force refresh result ===', data);

      // Update the store with the correct role
      if (data.correctRole && data.correctRole !== user.role) {
        console.log('=== AUTH STORE: Updating role from', user.role, 'to', data.correctRole);
        set({
          user: { ...user, role: data.correctRole as 'customer' | 'braider' | 'admin' }
        });
      }
    } catch (error) {
      console.error('=== AUTH STORE: Force refresh failed ===', error);
    }
  },
}));
