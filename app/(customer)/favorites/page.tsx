'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useBraiders } from '@/app/hooks/useBraiders';
import { Heart, Star, MapPin, Loader } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const { braiders } = useBraiders();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check if user is authenticated and is a customer
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'customer') {
      router.push('/');
      return;
    }

    // Load favorites from localStorage
    const saved = localStorage.getItem(`favorites_${user.id}`);
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, [user, authLoading, router]);

  const toggleFavorite = (braider_id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(braider_id)
        ? prev.filter((id) => id !== braider_id)
        : [...prev, braider_id];
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  const favoriteBraiders = braiders.filter((b: any) => favorites.includes(b.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">Favorite Braiders</h1>
          <p className="text-primary-100">Your saved braiders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {favoriteBraiders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No favorite braiders yet</p>
            <Link href="/search" className="text-primary-600 font-semibold hover:text-primary-700">
              Browse braiders →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteBraiders.map((braider: any, idx: number) => (
              <div
                key={braider.id}
                className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-smooth animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-200 to-accent-200">
                  {braider.avatar_url && (
                    <img
                      src={braider.avatar_url}
                      alt={braider.full_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => toggleFavorite(braider.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-smooth"
                  >
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{braider.full_name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{braider.rating_avg?.toFixed(1) || '5.0'}</span>
                        <span className="text-xs text-gray-500">({braider.rating_count || 0})</span>
                      </div>
                    </div>
                    {braider.verification_status !== 'unverified' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{braider.bio}</p>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{braider.travel_radius_miles} miles radius</span>
                    </div>
                  </div>

                  {braider.services && braider.services.length > 0 && (
                    <div className="mb-4 pb-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Services from:</p>
                      <p className="text-lg font-bold text-primary-600">
                        ${Math.min(...braider.services.map((s: any) => s.price)).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/braider/${braider.user_id || braider.id}`}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-center font-semibold text-sm"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/braider/${braider.user_id || braider.id}`}
                      className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-smooth font-semibold text-sm"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
