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
  const cacheRef = useRef<{ data: Braider[]; ts: number } | null>(null);
  const CACHE_TTL = 60_000; // 1 minute cache

  const fetchBraiders = async (force = false) => {
    // Return cached data if fresh (unless force is true)
    if (!force && cacheRef.current && Date.now() - cacheRef.current.ts < CACHE_TTL) {
      setBraiders(cacheRef.current.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add cache-busting query parameter
      const timestamp = Date.now();
      const response = await fetch(`/api/braiders?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch braiders');

      const data = await response.json();
      const braidersList: Braider[] = Array.isArray(data) ? data : [];

      const normalized = braidersList.map((b: any) => ({
        ...b,
        services: b.services || [],
        portfolio: b.portfolio || [],
        specialties: b.specialties || [],
        total_earnings: b.total_earnings || 0,
        available_balance: b.available_balance || 0,
      }));

      cacheRef.current = { data: normalized, ts: Date.now() };
      setBraiders(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setBraiders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch fresh data on mount, ignore cache
    fetchBraiders(true);

    if (!supabase) return;

    // Debounce real-time updates — don't refetch on every keystroke/change
    let debounceTimer: ReturnType<typeof setTimeout>;
    const subscription = supabase
      .channel('braider_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'braider_profiles' }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchBraiders(true), 2000);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { braiders, loading, error };
}
