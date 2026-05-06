import { create } from 'zustand';

export interface BraiderPortfolio {
  id: string;
  braider_id: string;
  image_url: string;
  title: string;
  description: string;
  style: string;
  created_at: string;
}

export interface BraiderService {
  id: string;
  braider_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

export interface BraiderProfile {
  id: string;
  user_id: string;
  full_name: string;
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
  services: BraiderService[];
  portfolio: BraiderPortfolio[];
  created_at: string;
  updated_at: string;
}

interface BraiderStore {
  braiders: BraiderProfile[];
  selectedBraider: BraiderProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  addBraider: (braider: BraiderProfile) => void;
  updateBraider: (id: string, updates: Partial<BraiderProfile>) => void;
  deleteBraider: (id: string) => void;
  selectBraider: (braider: BraiderProfile | null) => void;
  getBraiderById: (id: string) => BraiderProfile | undefined;
  getAllBraiders: () => BraiderProfile[];
  searchBraiders: (query: string) => BraiderProfile[];
  filterBraiders: (filters: {
    minRating?: number;
    maxPrice?: number;
    specialties?: string[];
    verified?: boolean;
  }) => BraiderProfile[];
  addPortfolioItem: (braider_id: string, item: BraiderPortfolio) => void;
  removePortfolioItem: (braider_id: string, item_id: string) => void;
  addService: (braider_id: string, service: BraiderService) => void;
  removeService: (braider_id: string, service_id: string) => void;
}

export const useBraiderStore = create<BraiderStore>((set, get) => ({
      braiders: [],
      selectedBraider: null,
      loading: false,
      error: null,

      addBraider: (braider) => {
        set((state) => ({
          braiders: [...state.braiders, braider],
        }));
      },

      updateBraider: (id, updates) => {
        set((state) => ({
          braiders: state.braiders.map((b) =>
            b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
          selectedBraider:
            state.selectedBraider?.id === id
              ? { ...state.selectedBraider, ...updates, updated_at: new Date().toISOString() }
              : state.selectedBraider,
        }));
      },

      deleteBraider: (id) => {
        set((state) => ({
          braiders: state.braiders.filter((b) => b.id !== id),
          selectedBraider: state.selectedBraider?.id === id ? null : state.selectedBraider,
        }));
      },

      selectBraider: (braider) => {
        set({ selectedBraider: braider });
      },

      getBraiderById: (id) => {
        return get().braiders.find((b) => b.id === id);
      },

      getAllBraiders: () => {
        return get().braiders;
      },

      searchBraiders: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().braiders.filter(
          (b) =>
            b.full_name.toLowerCase().includes(lowerQuery) ||
            b.bio.toLowerCase().includes(lowerQuery) ||
            b.specialties.some((s) => s.toLowerCase().includes(lowerQuery))
        );
      },

      filterBraiders: (filters) => {
        return get().braiders.filter((b) => {
          if (filters.minRating && b.rating_avg < filters.minRating) return false;
          if (filters.maxPrice) {
            const minPrice = Math.min(...b.services.map((s) => s.price));
            if (minPrice > filters.maxPrice) return false;
          }
          if (filters.specialties && filters.specialties.length > 0) {
            if (!filters.specialties.some((s) => b.specialties.includes(s))) return false;
          }
          if (filters.verified && b.verification_status === 'unverified') return false;
          return true;
        });
      },

      addPortfolioItem: (braider_id, item) => {
        set((state) => ({
          braiders: state.braiders.map((b) =>
            b.id === braider_id
              ? { ...b, portfolio: [...b.portfolio, item] }
              : b
          ),
        }));
      },

      removePortfolioItem: (braider_id, item_id) => {
        set((state) => ({
          braiders: state.braiders.map((b) =>
            b.id === braider_id
              ? { ...b, portfolio: b.portfolio.filter((p) => p.id !== item_id) }
              : b
          ),
        }));
      },

      addService: (braider_id, service) => {
        set((state) => ({
          braiders: state.braiders.map((b) =>
            b.id === braider_id
              ? { ...b, services: [...b.services, service] }
              : b
          ),
        }));
      },

      removeService: (braider_id, service_id) => {
        set((state) => ({
          braiders: state.braiders.map((b) =>
            b.id === braider_id
              ? { ...b, services: b.services.filter((s) => s.id !== service_id) }
              : b
          ),
        }));
      },
    }),
    {
      name: 'braider-store',
    }
  )
);
