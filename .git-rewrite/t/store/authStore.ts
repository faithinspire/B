import { create } from 'zustand';
import * as localAuth from '@/lib/localAuth';

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
  initializeSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  initializeSession: () => {
    try {
      const currentUser = localAuth.getCurrentUser();
      if (currentUser) {
        set({
          user: {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            full_name: currentUser.full_name,
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  },

  signUp: async (email, password, fullName, role) => {
    set({ loading: true, error: null });
    try {
      // Use local auth
      const user = await localAuth.localSignUp(email, password, fullName, role);

      set({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Use local auth
      const user = await localAuth.localSignIn(email, password);

      set({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      localAuth.localSignOut();
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchUser: async () => {
    set({ loading: true });
    try {
      const currentUser = localAuth.getCurrentUser();
      if (currentUser) {
        set({
          user: {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            full_name: currentUser.full_name,
          },
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
