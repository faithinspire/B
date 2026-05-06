import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface LocationUpdate {
  id: string;
  user_id: string;
  user_type: 'braider' | 'customer';
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  booking_id?: string;
}

export interface LocationTracking {
  braider_id: string;
  customer_id: string;
  booking_id: string;
  braider_location: LocationUpdate | null;
  customer_location: LocationUpdate | null;
  distance_miles: number;
  eta_minutes: number;
  status: 'tracking' | 'arrived' | 'completed';
  started_at: string;
  updated_at: string;
}

interface LocationStore {
  locations: Record<string, LocationUpdate>;
  tracking: Record<string, LocationTracking>;
  loading: boolean;
  error: string | null;

  // Location actions
  updateLocation: (userId: string, userType: 'braider' | 'customer', latitude: number, longitude: number, bookingId?: string) => Promise<void>;
  getLocation: (userId: string) => Promise<LocationUpdate | null>;
  startTracking: (bookingId: string, braiderId: string, customerId: string) => Promise<void>;
  stopTracking: (bookingId: string) => Promise<void>;
  getTracking: (bookingId: string) => Promise<LocationTracking | null>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  calculateETA: (distanceMiles: number, speedMph?: number) => number;

  // Real-time subscriptions
  subscribeToLocation: (userId: string, callback: (location: LocationUpdate) => void) => (() => void) | undefined;
  subscribeToTracking: (bookingId: string, callback: (tracking: LocationTracking) => void) => (() => void) | undefined;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: {},
  tracking: {},
  loading: false,
  error: null,

  updateLocation: async (userId, userType, latitude, longitude, bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const location: LocationUpdate = {
        id: `loc_${Date.now()}`,
        user_id: userId,
        user_type: userType,
        latitude,
        longitude,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        booking_id: bookingId,
      };

      const { error } = await supabase
        .from('location_tracking')
        .insert({
          user_id: userId,
          user_type: userType,
          latitude,
          longitude,
          accuracy: 10,
          booking_id: bookingId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        locations: { ...state.locations, [userId]: location },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update location';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getLocation: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return data as LocationUpdate;
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  },

  startTracking: async (bookingId, braiderId, customerId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const tracking: LocationTracking = {
        braider_id: braiderId,
        customer_id: customerId,
        booking_id: bookingId,
        braider_location: null,
        customer_location: null,
        distance_miles: 0,
        eta_minutes: 0,
        status: 'tracking',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('location_tracking_sessions')
        .insert({
          booking_id: bookingId,
          braider_id: braiderId,
          customer_id: customerId,
          status: 'tracking',
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        tracking: { ...state.tracking, [bookingId]: tracking },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start tracking';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  stopTracking: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('location_tracking_sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('booking_id', bookingId);

      if (error) throw error;

      set((state) => {
        const tracking = state.tracking[bookingId];
        if (!tracking) return state;

        return {
          tracking: {
            ...state.tracking,
            [bookingId]: { ...tracking, status: 'completed' },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop tracking';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getTracking: async (bookingId) => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('location_tracking_sessions')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) throw error;
      return data as LocationTracking;
    } catch (error) {
      console.error('Failed to get tracking:', error);
      return null;
    }
  },

  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  calculateETA: (distanceMiles, speedMph = 25) => {
    return Math.ceil((distanceMiles / speedMph) * 60);
  },

  subscribeToLocation: (userId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`location_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as LocationUpdate);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToTracking: (bookingId, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`tracking_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'location_tracking_sessions',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          callback(payload.new as LocationTracking);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
}));
