import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'braider' | 'admin';
  avatar_url?: string;
  country?: string;
  phone?: string;
  phone_country?: string;
}

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  signOut: () => Promise<void>; // alias for logout, used by Navigation
  recoverSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}

const STORAGE_KEY = 'braidmee_auth_session';
const USER_STORAGE_KEY = 'braidmee_user';

export const useSupabaseAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setUser: (user) => {
    set({ user });
    // PHASE 2: Persist user to localStorage
    if (user) {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error('Failed to persist user to localStorage:', e);
      }
    } else {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch (e) {
        console.error('Failed to remove user from localStorage:', e);
      }
    }
  },

  setSession: (session) => {
    set({ session });
    // PHASE 2: Persist session to localStorage
    if (session) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.error('Failed to persist session to localStorage:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to remove session from localStorage:', e);
      }
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  logout: () => {
    set({ user: null, session: null, error: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage on logout:', e);
    }
  },

  // signOut is an alias for logout — used by Navigation component
  signOut: async () => {
    set({ user: null, session: null, error: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      // Also sign out from Supabase to invalidate the token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Failed to sign out:', e);
    }
  },

  /**
   * PHASE 2: Recover session from localStorage on app load
   * This prevents users from being logged out when page refreshes
   */
  recoverSession: async () => {
    try {
      set({ loading: true });

      // Try to recover from localStorage first
      const storedSession = localStorage.getItem(STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedSession && storedUser) {
        try {
          const session = JSON.parse(storedSession);
          const user = JSON.parse(storedUser);

          // Verify session is still valid
          if (session && session.access_token) {
            set({ session, user, loading: false, error: null });
            console.log('✅ Session recovered from localStorage');
            return;
          }
        } catch (e) {
          console.error('Failed to parse stored session:', e);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }

      // If no stored session, try to get from Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Failed to get session from Supabase:', error);
        set({ loading: false, error: error.message });
        return;
      }

      if (session && session.user) {
        // Fetch user profile to get role and other data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Failed to fetch profile:', profileError);
          set({ loading: false, error: profileError.message });
          return;
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile?.full_name || '',
          role: profile?.role || 'customer',
          avatar_url: profile?.avatar_url,
          country: profile?.country,
          phone: profile?.phone,
          phone_country: profile?.phone_country,
        };

        set({ session, user, loading: false, error: null });
        // Persist to localStorage
        get().setSession(session);
        get().setUser(user);
        console.log('✅ Session recovered from Supabase');
      } else {
        set({ loading: false, error: null });
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Session recovery error:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  /**
   * PHASE 2: Refresh session to keep user logged in
   * Called periodically or when session is about to expire
   */
  refreshSession: async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Failed to refresh session:', error);
        get().logout();
        return;
      }

      if (session) {
        get().setSession(session);
        console.log('✅ Session refreshed');
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      get().logout();
    }
  },

  /**
   * Sign in with email and password
   * Fetches user profile and stores in state
   */
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      // Call the login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.session && data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          role: data.user.role || 'customer',
          avatar_url: data.user.avatar_url,
          country: data.user.country,
        };

        set({ user, session: data.session, loading: false, error: null });
        get().setSession(data.session);
        get().setUser(user);
        console.log('✅ User signed in successfully');
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      set({ loading: false, error: errorMsg });
      throw error;
    }
  },
}));

/**
 * PHASE 2: Initialize auth store on app load
 * Recovers session from localStorage and sets up refresh interval
 */
export async function initializeAuthStore() {
  const store = useSupabaseAuthStore.getState();
  
  // Recover session from localStorage
  await store.recoverSession();

  // Set up session refresh interval (every 50 minutes)
  // Supabase sessions expire after 1 hour, so refresh before expiry
  const refreshInterval = setInterval(() => {
    store.refreshSession();
  }, 50 * 60 * 1000);

  // Clean up interval on logout
  const unsubscribe = useSupabaseAuthStore.subscribe(
    (state) => state.user,
    (user) => {
      if (!user) {
        clearInterval(refreshInterval);
      }
    }
  );

  return () => {
    clearInterval(refreshInterval);
    unsubscribe();
  };
}
