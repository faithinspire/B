import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'customer' | 'braider' | 'admin';
  full_name: string;
  avatar_url?: string;
  country?: string; // 'NG' | 'US' — used for payment routing
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
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
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { set({ user: null, accessToken: null }); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, country')
        .eq('id', session.user.id)
        .single();

      if (!profile) { set({ user: null, accessToken: null }); return; }

      set({
        user: {
          id: session.user.id,
          email: profile.email || '',
          role: (profile.role || 'customer') as 'customer' | 'braider' | 'admin',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
          country: profile.country || undefined,
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
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
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

      // Sign in via supabase client to persist session in browser
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
      const msg = error instanceof Error ? error.message : 'Failed to sign up';
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
    set({ loading: true, error: null });
    try {
      // Sign in via supabase client first — this persists the session cookie in the browser
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Invalid credentials');
      }

      // Call backend to get the correct role from profiles table
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
          country: data.user.country || undefined,
        },
        accessToken: authData.session?.access_token || data.session?.access_token || null,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to sign in';
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
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
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { set({ user: null, accessToken: null }); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, country')
        .eq('id', session.user.id)
        .single();

      if (!profile) { set({ user: null, accessToken: null }); return; }

      set({
        user: {
          id: session.user.id,
          email: profile.email || '',
          role: (profile.role || 'customer') as 'customer' | 'braider' | 'admin',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
          country: profile.country || undefined,
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
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to reset password';
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePassword: async (newPassword) => {
    if (!supabase) { set({ error: 'Supabase not configured' }); return; }
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update password';
      set({ error: msg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
