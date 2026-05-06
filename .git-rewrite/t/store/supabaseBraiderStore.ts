import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Portfolio {
  id: string;
  braider_id: string;
  image_url: string;
  title: string;
  description: string;
  style: string;
  created_at: string;
}

export interface Service {
  id: string;
  braider_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  created_at: string;
}

export interface BraiderProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio: string;
  experience_years: number;
  rating_avg: number;
  rating_count: number;
  verification_status: 'unverified' | 'tier1_verified' | 'tier2_verified' | 'safety_badge_pro';
  travel_radius_miles: number;
  is_mobile: boolean;
  salon_address?: string;
  specialties: string[];
  services: Service[];
  portfolio: Portfolio[];
  total_earnings: number;
  available_balance: number;
  created_at: string;
  updated_at: string;
}

interface BraiderProfileStore {
  profiles: Record<string, BraiderProfile>;
  currentProfile: BraiderProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Profile actions
  createProfile: (userId: string, data: Partial<BraiderProfile>) => Promise<BraiderProfile>;
  updateProfile: (userId: string, data: Partial<BraiderProfile>) => Promise<void>;
  getProfile: (userId: string) => Promise<BraiderProfile | null>;
  setCurrentProfile: (userId: string) => Promise<void>;
  getAllProfiles: () => Promise<BraiderProfile[]>;
  initializeStore: () => Promise<void>;

  // Portfolio actions
  addPortfolioItem: (userId: string, item: Omit<Portfolio, 'id' | 'created_at'>) => Promise<Portfolio>;
  removePortfolioItem: (userId: string, itemId: string) => Promise<void>;
  getPortfolio: (userId: string) => Promise<Portfolio[]>;

  // Service actions
  addService: (userId: string, service: Omit<Service, 'id' | 'created_at'>) => Promise<Service>;
  updateService: (userId: string, serviceId: string, data: Partial<Service>) => Promise<void>;
  removeService: (userId: string, serviceId: string) => Promise<void>;
  getServices: (userId: string) => Promise<Service[]>;

  // Earnings actions
  addEarnings: (userId: string, amount: number) => Promise<void>;
  requestPayout: (userId: string, amount: number, bankAccount: string) => Promise<{ success: boolean; transactionId: string }>;
  getBalance: (userId: string) => Promise<{ total: number; available: number }>;

  // Real-time subscriptions
  subscribeToProfiles: () => (() => void) | undefined;
  unsubscribeFromProfiles: () => void;
}

export const useSupabaseBraiderStore = create<BraiderProfileStore>((set, get) => ({
  profiles: {},
  currentProfile: null,
  loading: false,
  error: null,
  initialized: false,

  initializeStore: async () => {
    if (get().initialized) return;
    
    try {
      set({ loading: true });
      await get().getAllProfiles();
      get().subscribeToProfiles();
      set({ initialized: true });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to initialize' });
    } finally {
      set({ loading: false });
    }
  },

  createProfile: async (userId, data) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const profile: BraiderProfile = {
        id: `braider_${Date.now()}`,
        user_id: userId,
        full_name: data.full_name || '',
        email: data.email || '',
        avatar_url: data.avatar_url,
        bio: data.bio || '',
        experience_years: data.experience_years || 0,
        rating_avg: 5.0,
        rating_count: 0,
        verification_status: 'unverified',
        travel_radius_miles: data.travel_radius_miles || 10,
        is_mobile: data.is_mobile || false,
        salon_address: data.salon_address,
        specialties: data.specialties || [],
        services: [],
        portfolio: [],
        total_earnings: 0,
        available_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only insert fields that exist in the database (no email field)
      const { error } = await supabase
        .from('braider_profiles')
        .upsert({
          user_id: userId,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          experience_years: profile.experience_years,
          rating_avg: profile.rating_avg,
          rating_count: profile.rating_count,
          verification_status: profile.verification_status,
          travel_radius_miles: profile.travel_radius_miles,
          is_mobile: profile.is_mobile,
          salon_address: profile.salon_address,
          specialties: profile.specialties,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      set((state) => ({
        profiles: { ...state.profiles, [userId]: profile },
        currentProfile: profile,
      }));

      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create profile';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (userId, data) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('braider_profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = { ...profile, ...data, updated_at: new Date().toISOString() };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getProfile: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('braider_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as BraiderProfile;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  },

  setCurrentProfile: async (userId) => {
    const profile = await get().getProfile(userId);
    if (profile) {
      set({ currentProfile: profile });
    }
  },

  getAllProfiles: async () => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('braider_profiles')
        .select('*')
        .order('rating_avg', { ascending: false });

      if (error) throw error;

      const profiles: Record<string, BraiderProfile> = {};
      (data || []).forEach((profile) => {
        profiles[profile.user_id] = profile as BraiderProfile;
      });

      set({ profiles });
      return Object.values(profiles);
    } catch (error) {
      console.error('Failed to get profiles:', error);
      return [];
    }
  },

  addPortfolioItem: async (userId, item) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const portfolio: Portfolio = {
        id: `portfolio_${Date.now()}`,
        ...item,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('portfolio').insert(portfolio);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = { ...profile, portfolio: [...profile.portfolio, portfolio] };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });

      return portfolio;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add portfolio item';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removePortfolioItem: async (userId, itemId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('portfolio').delete().eq('id', itemId);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = { ...profile, portfolio: profile.portfolio.filter((p) => p.id !== itemId) };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove portfolio item';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getPortfolio: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase.from('portfolio').select('*').eq('braider_id', userId);

      if (error) throw error;
      return (data || []) as Portfolio[];
    } catch (error) {
      console.error('Failed to get portfolio:', error);
      return [];
    }
  },

  addService: async (userId, service) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const newService: Service = {
        id: `service_${Date.now()}`,
        ...service,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('services').insert(newService);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = { ...profile, services: [...profile.services, newService] };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });

      return newService;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add service';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateService: async (userId, serviceId, data) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('services').update(data).eq('id', serviceId);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = {
          ...profile,
          services: profile.services.map((s) => (s.id === serviceId ? { ...s, ...data } : s)),
        };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update service';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeService: async (userId, serviceId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = { ...profile, services: profile.services.filter((s) => s.id !== serviceId) };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove service';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getServices: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase.from('services').select('*').eq('braider_id', userId);

      if (error) throw error;
      return (data || []) as Service[];
    } catch (error) {
      console.error('Failed to get services:', error);
      return [];
    }
  },

  addEarnings: async (userId, amount) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const profile = get().profiles[userId];
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('braider_profiles')
        .update({
          total_earnings: profile.total_earnings + amount,
          available_balance: profile.available_balance + amount,
        })
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = {
          ...profile,
          total_earnings: profile.total_earnings + amount,
          available_balance: profile.available_balance + amount,
        };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add earnings';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  requestPayout: async (userId, amount, _bankAccount) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const profile = get().profiles[userId];
      if (!profile) throw new Error('Profile not found');
      if (profile.available_balance < amount) throw new Error('Insufficient balance');

      const { error } = await supabase
        .from('braider_profiles')
        .update({ available_balance: profile.available_balance - amount })
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => {
        const profile = state.profiles[userId];
        if (!profile) return state;

        const updated = { ...profile, available_balance: profile.available_balance - amount };
        return {
          profiles: { ...state.profiles, [userId]: updated },
          currentProfile: state.currentProfile?.user_id === userId ? updated : state.currentProfile,
        };
      });

      return { success: true, transactionId: `txn_${Date.now()}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request payout';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getBalance: async (userId) => {
    const profile = get().profiles[userId];
    return {
      total: profile?.total_earnings || 0,
      available: profile?.available_balance || 0,
    };
  },

  subscribeToProfiles: () => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel('braider_profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'braider_profiles' },
        (payload) => {
          set((state) => {
            const profiles = { ...state.profiles };
            if (payload.eventType === 'DELETE') {
              delete profiles[payload.old.user_id];
            } else {
              profiles[payload.new.user_id] = payload.new as BraiderProfile;
            }
            return { profiles };
          });
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  unsubscribeFromProfiles: () => {
    // Handled by subscription cleanup
  },
}));
