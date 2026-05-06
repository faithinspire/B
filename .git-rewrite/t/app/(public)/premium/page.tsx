'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Crown, Star, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export default function PremiumBraidersPage() {
  const [braiders, setBraiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = db();
      const { data } = await supabase
        .from('braider_profiles')
        .select(`
          id, bio, rating_avg, rating_count, travel_radius_miles,
          is_premium, premium_since, featured_order,
          profiles!inner(full_name, avatar_url)
        `)
        .eq('is_premium', true)
        .order('featured_order', { ascending: false })
        .order('rating_avg', { ascending: false });
      setBraiders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-yellow-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif font-bold text-primary-600">BraidMe</Link>
          <Link href="/search" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft className="w-4 h-4" /> All Braiders
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" /> Premium Braiders
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Elite Braiding Professionals
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our verified premium braiders are top-rated professionals who deliver exceptional results.
            They appear first in search and have dedicated blog pages.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : braiders.length === 0 ? (
          <div className="text-center py-20">
            <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No premium braiders yet. Be the first!</p>
            <Link href="/braider/premium" className="mt-4 inline-block px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all">
              Become Premium
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {braiders.map((braider) => {
              const profile = (braider.profiles as any) || {};
              return (
                <Link key={braider.id} href={`/premium/${braider.id}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden group border border-yellow-100">
                  <div className="relative h-44 bg-gradient-to-br from-yellow-200 to-amber-200 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-6xl">💇</span>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold shadow">
                      <Crown className="w-3 h-3" /> Premium
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{profile.full_name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{(braider.rating_avg || 5).toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({braider.rating_count || 0})</span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{braider.bio}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{braider.travel_radius_miles} mi radius</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA for braiders */}
        <div className="mt-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-8 text-white text-center">
          <Crown className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Are You a Braider?</h2>
          <p className="text-yellow-100 mb-6">Join our premium program and get more clients, higher visibility, and your own blog page.</p>
          <Link href="/braider/premium" className="inline-block px-8 py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-yellow-50 transition-all">
            Become Premium — from $89/mo
          </Link>
        </div>
      </div>
    </div>
  );
}
