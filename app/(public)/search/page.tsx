'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBraiders } from '@/app/hooks/useBraiders';
import { Star, MapPin, Filter } from 'lucide-react';

interface Braider {
  id: string;
  user_id?: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
  verification_status: string;
  travel_radius_miles: number;
  full_name: string;
  avatar_url?: string;
  specialties?: string[];
  services: Array<{
    price: number;
  }>;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { braiders: allBraiders, loading: initialLoading } = useBraiders();
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 500,
    minRating: 0,
    verified: false,
  });

  useEffect(() => {
    fetchBraiders();
  }, [searchParams, filters, allBraiders]);

  const fetchBraiders = () => {
    setLoading(true);
    try {
      let results = allBraiders as Braider[];

      // Filter by verified status
      if (filters.verified) {
        results = results.filter(b => b.verification_status !== 'unverified');
      }

      // Filter by rating
      results = results.filter(b => b.rating_avg >= filters.minRating);

      // Filter by price
      results = results.filter(b => {
        if (!b.services || b.services.length === 0) return true;
        const minPrice = Math.min(...b.services.map(s => s.price));
        return minPrice <= filters.maxPrice;
      });

      // Search by location or style
      const location = searchParams.get('location');
      const style = searchParams.get('style');

      if (location) {
        results = results.filter(b => 
          b.full_name.toLowerCase().includes(location.toLowerCase()) ||
          b.bio.toLowerCase().includes(location.toLowerCase())
        );
      }

      if (style) {
        results = results.filter(b =>
          b.specialties?.some((s: string) => s.toLowerCase().includes(style.toLowerCase()))
        );
      }

      setBraiders(results);
    } catch (error) {
      console.error('Error fetching braiders:', error);
      setBraiders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <Link href="/" className="text-xl sm:text-2xl font-serif font-bold text-primary-600 mb-2 sm:mb-4 block">
            Braidly
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Search Results</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Filter className="w-4 sm:w-5 h-4 sm:h-5" />
                <h2 className="font-semibold text-sm sm:text-base">Filters</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Price Range */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Price Range</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs sm:text-sm text-gray-600">Up to ${filters.maxPrice}</p>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Minimum Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    className="input-field text-xs sm:text-sm"
                  >
                    <option value="0">All ratings</option>
                    <option value="3">3+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>

                {/* Verification */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs sm:text-sm font-medium">Verified Only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 animate-pulse">
                    <div className="h-20 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : braiders.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-12 text-center">
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">No braiders found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {braiders.map((braider) => (
                  <Link
                    key={braider.id}
                    href={`/braider/${braider.user_id || braider.id}`}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6"
                  >
                    <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-primary-200 to-accent-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {braider.avatar_url ? (
                        <img src={braider.avatar_url} alt={braider.full_name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl sm:text-3xl">💇</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                        <div>
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold">{braider.full_name}</h3>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1">
                            <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-medium">{braider.rating_avg.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({braider.rating_count})</span>
                          </div>
                        </div>
                        {braider.verification_status !== 'unverified' && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{braider.bio}</p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span>{braider.travel_radius_miles} mi</span>
                          </div>
                          <span>From ${braider.services.length > 0 ? Math.min(...braider.services.map(s => s.price)).toFixed(2) : 'N/A'}</span>
                        </div>
                        <Link href={`/booking`} className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-xs sm:text-sm font-semibold text-center">
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
