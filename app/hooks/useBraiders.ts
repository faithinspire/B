'use client';

import { useState, useEffect, useRef } from 'react';
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
  specialization?: string;
  profession_type?: string;
  state?: string;
  city?: string;
  country?: string;
  services?: any[];
  portfolio?: any[];
  total_earnings?: number;
  available_balance?: number;
  total_bookings?: number;
  instagram_url?: string;
  tiktok_url?: string;
  portfolio_media?: any[];
  created_at?: string;
  updated_at?: string;
}

export function useBraiders() {
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAttemptRef = useRef(0);

  const fetchBraiders = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      fetchAttemptRef.current++;
      const attemptNumber = fetchAttemptRef.current;

      console.log(`=== HOOK: Fetch attempt #${attemptNumber} (force=${force}) ===`);

      // HARD FIX: Always fetch fresh, never use cache
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const url = `/api/braiders?t=${timestamp}&id=${randomId}`;
      
      console.log(`=== HOOK: Fetching from ${url} ===`);

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': timestamp.toString(),
          'X-Random': randomId,
        },
      });

      console.log(`=== HOOK: Response status ${response.status} ===`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`=== HOOK: Received ${Array.isArray(data) ? data.length : 0} braiders ===`, data);

      const braidersList: Braider[] = Array.isArray(data) ? data : [];

      if (braidersList.length === 0) {
        console.warn('=== HOOK: WARNING - No braiders returned from API ===');
      }

      const normalized = braidersList.map((b: any) => ({
        ...b,
        services: b.services || [],
        portfolio: b.portfolio || [],
        specialties: b.specialties || [],
        total_earnings: b.total_earnings || 0,
        available_balance: b.available_balance || 0,
      }));

      console.log(`=== HOOK: Setting ${normalized.length} braiders ===`);
      setBraiders(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`=== HOOK: Error on attempt #${fetchAttemptRef.current} ===`, message);
      setError(message);
      setBraiders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== HOOK: Component mounted, fetching braiders ===');
    // HARD FIX: Always fetch on mount, ignore any cache
    fetchBraiders(true);

    if (!supabase) {
      console.warn('=== HOOK: Supabase not available ===');
      return;
    }

    // Real-time subscription
    let debounceTimer: ReturnType<typeof setTimeout>;
    const subscription = supabase
      .channel('braider_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'braider_profiles' }, () => {
        console.log('=== HOOK: Real-time change detected, refetching ===');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchBraiders(true), 1000);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { braiders, loading, error };
}
