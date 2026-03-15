'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Braider {
  id?: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio: string;
  experience_years: number;
  rating_avg: number;
  rating_count: number;
  verification_status: string;
  travel_radius_miles: number;
  is_mobile: boolean;
  salon_address?: string;
  specialties?: string[];
  services?: any[];
  portfolio?: any[];
  total_earnings?: number;
  available_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export function useBraiders() {
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBraiders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching braiders from /api/braiders...');
      
      const response = await fetch('/api/braiders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch braiders');
      }
      
      const data = await response.json();
      console.log('Braiders API response:', { count: Array.isArray(data) ? data.length : 0, data });
      
      const braidersList = Array.isArray(data) ? data : [];
      
      // Ensure all braiders have required fields
      const normalizedBraiders = braidersList.map((b: any) => ({
        ...b,
        services: b.services || [],
        portfolio: b.portfolio || [],
        specialties: b.specialties || [],
        total_earnings: b.total_earnings || 0,
        available_balance: b.available_balance || 0,
      }));
      
      console.log('Normalized braiders:', { count: normalizedBraiders.length, normalizedBraiders });
      setBraiders(normalizedBraiders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching braiders:', err);
      setBraiders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchBraiders();

    // Set up real-time subscription to braider_profiles table
    if (!supabase) {
      console.log('Supabase not configured, skipping real-time subscription');
      return;
    }

    try {
      const subscription = supabase
        .channel('braider_profiles_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'braider_profiles',
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            // Refetch braiders when changes occur
            fetchBraiders();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up real-time subscription:', err);
    }
  }, []);

  return { braiders, loading, error };
}
