import { create } from 'zustand';

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
  bank_account?: string;
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

  // Profile actions
  createProfile: (userId: string, data: Partial<BraiderProfile>) => Promise<BraiderProfile>;
  updateProfile: (userId: string, data: Partial<BraiderProfile>) => Promise<void>;
  getProfile: (userId: string) => BraiderProfile | undefined;
  setCurrentProfile: (userId: string) => void;

  // Portfolio actions
  addPortfolioItem: (userId: string, item: Omit<Portfolio, 'id' | 'created_at'>) => Promise<Portfolio>;
  removePortfolioItem: (userId: string, itemId: string) => Promise<void>;
  getPortfolio: (userId: string) => Portfolio[];

  // Service actions
  addService: (userId: string, service: Omit<Service, 'id' | 'created_at'>) => Promise<Service>;
  updateService: (userId: string, serviceId: string, data: Partial<Service>) => Promise<void>;
  removeService: (userId: string, serviceId: string) => Promise<void>;
  getServices: (userId: string) => Service[];

  // Earnings actions
  addEarnings: (userId: string, amount: number) => Promise<void>;
  requestPayout: (userId: string, amount: number, bankAccount: string) => Promise<{ success: boolean; transactionId: string }>;
  getBalance: (userId: string) => { total: number; available: number };
}

export const useBraiderProfileStore = create<BraiderProfileStore>((set, get) => ({
      profiles: {},
      currentProfile: null,
      loading: false,
      error: null,

      createProfile: async (userId, data) => {
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

          const profiles = { ...get().profiles };
          // Store by userId (primary key)
          profiles[userId] = profile;
          // Also store by email for lookup flexibility
          if (data.email) {
            profiles[data.email] = profile;
          }
          set({ profiles, currentProfile: profile });
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
        set({ loading: true, error: null });
        try {
          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          const updated = {
            ...profile,
            ...data,
            updated_at: new Date().toISOString(),
          };
          profiles[userId] = updated;
          set({ profiles, currentProfile: updated });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update profile';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      getProfile: (userId) => {
        return get().profiles[userId];
      },

      setCurrentProfile: (userId) => {
        const profile = get().profiles[userId];
        if (profile) {
          set({ currentProfile: profile });
        }
      },

      addPortfolioItem: async (userId, item) => {
        set({ loading: true, error: null });
        try {
          const portfolio: Portfolio = {
            id: `portfolio_${Date.now()}`,
            ...item,
            created_at: new Date().toISOString(),
          };

          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          profile.portfolio.push(portfolio);
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });
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
        set({ loading: true, error: null });
        try {
          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          profile.portfolio = profile.portfolio.filter((p) => p.id !== itemId);
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove portfolio item';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      getPortfolio: (userId) => {
        return get().profiles[userId]?.portfolio || [];
      },

      addService: async (userId, service) => {
        set({ loading: true, error: null });
        try {
          const newService: Service = {
            id: `service_${Date.now()}`,
            ...service,
            created_at: new Date().toISOString(),
          };

          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          profile.services.push(newService);
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });
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
        set({ loading: true, error: null });
        try {
          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          const serviceIndex = profile.services.findIndex((s) => s.id === serviceId);
          if (serviceIndex === -1) throw new Error('Service not found');

          profile.services[serviceIndex] = {
            ...profile.services[serviceIndex],
            ...data,
          };
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update service';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      removeService: async (userId, serviceId) => {
        set({ loading: true, error: null });
        try {
          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          profile.services = profile.services.filter((s) => s.id !== serviceId);
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove service';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      getServices: (userId) => {
        return get().profiles[userId]?.services || [];
      },

      addEarnings: async (userId, amount) => {
        set({ loading: true, error: null });
        try {
          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');

          profile.total_earnings += amount;
          profile.available_balance += amount;
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add earnings';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      requestPayout: async (userId, amount, bankAccount) => {
        set({ loading: true, error: null });
        try {
          const profiles = { ...get().profiles };
          const profile = profiles[userId];
          if (!profile) throw new Error('Profile not found');
          if (profile.available_balance < amount) throw new Error('Insufficient balance');

          profile.available_balance -= amount;
          profile.bank_account = bankAccount;
          profiles[userId] = profile;
          set({ profiles, currentProfile: profile });

          return {
            success: true,
            transactionId: `txn_${Date.now()}`,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to request payout';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      getBalance: (userId) => {
        const profile = get().profiles[userId];
        return {
          total: profile?.total_earnings || 0,
          available: profile?.available_balance || 0,
        };
      },
    }));
