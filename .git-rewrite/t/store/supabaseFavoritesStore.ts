import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface FavoritesStore {
  favorites: string[];
  loading: boolean;
  error: string | null;
  subscriptionUnsubscribe: (() => void) | null;

  // Favorites actions
  getFavorites: (userId: string) => Promise<string[]>;
  addFavorite: (userId: string, braiderId: string) => Promise<void>;
  removeFavorite: (userId: string, braiderId: string) => Promise<void>;
  isFavorite: (braiderId: string) => boolean;
  toggleFavorite: (userId: string, braiderId: string) => Promise<void>;

  // Real-time subscriptions
  subscribeToFavorites: (userId: string) => void;
  unsubscribeFromFavorites: () => void;
}

export const useSupabaseFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  loading: false,
  error: null,
  subscriptionUnsubscribe: null,

  getFavorites: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('braider_id')
        .eq('user_id', userId);

      if (error) throw error;

      const favoriteIds = (data || []).map((f) => f.braider_id);
      set({ favorites: favoriteIds });

      return favoriteIds;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get favorites';
      set({ error: message });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  addFavorite: async (userId, braiderId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          braider_id: braiderId,
        });

      if (error) throw error;

      set((state) => ({
        favorites: [...state.favorites, braiderId],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add favorite';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeFavorite: async (userId, braiderId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('braider_id', braiderId);

      if (error) throw error;

      set((state) => ({
        favorites: state.favorites.filter((id) => id !== braiderId),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove favorite';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  isFavorite: (braiderId) => {
    return get().favorites.includes(braiderId);
  },

  toggleFavorite: async (userId, braiderId) => {
    const isFav = get().isFavorite(braiderId);
    if (isFav) {
      await get().removeFavorite(userId, braiderId);
    } else {
      await get().addFavorite(userId, braiderId);
    }
  },

  subscribeToFavorites: (userId) => {
    if (!supabase) return;

    const unsubscribe = supabase
      .from('favorites')
      .on('*', (payload) => {
        if (payload.new?.user_id === userId) {
          set((state) => {
            if (payload.eventType === 'DELETE') {
              return {
                favorites: state.favorites.filter((id) => id !== payload.old?.braider_id),
              };
            }

            const braiderId = payload.new?.braider_id;
            if (!state.favorites.includes(braiderId)) {
              return { favorites: [...state.favorites, braiderId] };
            }

            return state;
          });
        }
      })
      .subscribe();

    set({ subscriptionUnsubscribe: () => unsubscribe.unsubscribe() });
  },

  unsubscribeFromFavorites: () => {
    const unsubscribe = get().subscriptionUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ subscriptionUnsubscribe: null });
    }
  },
}));
