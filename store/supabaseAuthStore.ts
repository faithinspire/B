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
  accessToken: string | null;  // Store the JWT token directly
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string, role: 'customer' | 'braider' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initializeSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useSupabaseAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
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

      if (!session?.user) {
        set({ user: null, accessToken: null });
        return;
      }

      // Store the access token
      set({ accessToken: session.access_token });

      // HARD FIX: Fetch profile from database - this is the source of truth
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        set({ user: null, accessToken: null });
        return;
      }

      // Determine role: profile.role is source of truth
      let role = (profile.role || 'customer') as 'customer' | 'braider' | 'admin';

      set({
        user: {
          id: session.user.id,
          email: profile.email || '',
          role,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
        },
        accessToken: session.access_token,
      });
    } catch (error) {
      console.error('Failed to initialize session:', error);
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();

      // Also sign in via supabase client to get session token
      const { data: authData } = await supabase.auth.signInWithPassword({ email, password });

      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          full_name: data.user.full_name,
        },
        accessToken: authData.session?.access_token || null,
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
      // Sign in via supabase client directly to get session persisted in browser
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Invalid credentials');
      }

      // Also call backend to get correct role
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();

      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          full_name: data.user.full_name,
          avatar_url: data.user.avatar_url,
        },
        accessToken: authData.session?.access_token || data.session?.access_token || null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
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
      set({ user: null, accessToken: null });
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Signout error:', error);
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

      if (!session?.user) {
        set({ user: null, accessToken: null });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        set({ user: null, accessToken: null });
        return;
      }

      set({
        user: {
          id: session.user.id,
          email: profile.email || '',
          role: (profile.role || 'customer') as 'customer' | 'braider' | 'admin',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
        },
        accessToken: session.access_token,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

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

      if (!session?.user) {
        set({ user: null });
        return;
      }

      // HARD FIX: Fetch profile from database - this is the source of truth
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        set({ user: null });
        return;
      }

      // Determine role: profile.role is source of truth
      let role = (profile.role || 'customer') as 'customer' | 'braider' | 'admin';

      set({
        user: {
          id: session.user.id,
          email: profile.email || '',
          role,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to initialize session:', error);
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
      // Call backend signup endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();

      // Set user with role from response
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          full_name: data.user.full_name,
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
      // Call backend login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();

      // Set user with role from response
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          full_name: data.user.full_name,
          avatar_url: data.user.avatar_url,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
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
      set({ user: null });
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Signout error:', error);
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

      if (!session?.user) {
        set({ user: null });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        set({ user: null });
        return;
      }

      set({
        user: {
          id: session.user.id,
          email: profile.email || '',
          role: (profile.role || 'customer') as 'customer' | 'braider' | 'admin',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
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
}));
