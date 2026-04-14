'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBraiders } from '@/app/hooks/useBraiders';
import { Star, MapPin, Filter, Crown } from 'lucide-react';

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
  is_premium?: boolean;
  featured_order?: number;
  services: Array<{
    price: number;
  }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const { braiders: allBraiders, loading: initialLoading } = useBraiders();
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 500,
    minRating: 0,
    verified: false,
    premiumOnly: false,
  });

  useEffect(() => {
    fetchBraiders();
  }, [searchParams, filters, allBraiders]);

  const fetchBraiders = () => {
    setLoading(true);
    try {
      let results = allBraiders as Braider[];

      // Filter by verified status — only show truly verified braiders
      if (filters.verified) {
        results = results.filter(b => b.verification_status === 'verified');
      }

      // Filter by premium
      if (filters.premiumOnly) {
        results = results.filter(b => b.is_premium);
      }

      // Filter by rating — skip unrated braiders if minRating > 0
      results = results.filter(b => filters.minRating === 0 || (b.rating_avg != null && b.rating_avg >= filters.minRating));

      // Filter by price
      results = results.filter(b => {
        if (!b.services || b.services.length === 0) return true;
        const minPrice = Math.min(...b.services.map(s => s.price));
        return minPrice <= filters.maxPrice;
      });

      // Search by location or style
      const location = searchParams?.get('location');
      const style = searchParams?.get('style');
      const country = searchParams?.get('country') || 'NG';

      if (location) {
        // Filter by state/city/country
        results = results.filter(b => {
          const locationMatch = 
            b.state?.toLowerCase().includes(location.toLowerCase()) ||
            b.city?.toLowerCase().includes(location.toLowerCase()) ||
            b.full_name.toLowerCase().includes(location.toLowerCase()) ||
            b.bio.toLowerCase().includes(location.toLowerCase());
          
          // Also filter by country if specified
          const countryMatch = !country || b.country === country;
          
          return locationMatch && countryMatch;
        });
      } else if (country) {
        // Filter by country even if no specific location
        results = results.filter(b => b.country === country);
      }

      if (style) {
        results = results.filter(b =>
          b.specialties?.some((s: string) => s.toLowerCase().includes(style.toLowerCase())) ||
          b.specialization?.toLowerCase().includes(style.toLowerCase())
        );
      }

      // Sort: premium first (by featured_order desc), then by rating
      results.sort((a, b) => {
        if (a.is_premium && !b.is_premium) return -1;
        if (!a.is_premium && b.is_premium) return 1;
        if (a.is_premium && b.is_premium) return (b.featured_order || 0) - (a.featured_order || 0);
        return b.rating_avg - a.rating_avg;
      });

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
            BraidMe
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

                {/* Premium */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.premiumOnly}
                      onChange={(e) => setFilters({ ...filters, premiumOnly: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3 text-yellow-500" /> Premium Only
                    </span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {braiders.map((braider) => (
                  <Link
                    key={braider.id}
                    href={`/braider/${braider.user_id || braider.id}`}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col h-full"
                  >
                    {/* Card Header with Avatar */}
                    <div className="relative h-32 sm:h-40 bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden">
                      {braider.avatar_url ? (
                        <img src={braider.avatar_url} alt={braider.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl sm:text-6xl">💇</span>
                      )}
                      {braider.is_premium && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow">
                          <Crown className="w-3 h-3" /> Premium
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1">{braider.full_name}</h3>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                        <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {braider.rating_avg ? braider.rating_avg.toFixed(1) : 'New'}
                        </span>
                        <span className="text-xs text-gray-500">({braider.rating_count || 0})</span>
                      </div>

                      {/* Bio */}
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-1">{braider.bio}</p>

                      {/* Info */}
                      <div className="space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                          <span>{braider.travel_radius_miles} mi radius</span>
                        </div>
                        <div>
                          From ${braider.services.length > 0 ? Math.min(...braider.services.map(s => s.price)).toFixed(2) : 'N/A'}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                        {braider.is_premium && (
                          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                        )}
                        {braider.verification_status === 'verified' && (
                          <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link href={`/booking`} className="w-full px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-xs sm:text-sm font-semibold text-center">
                        Book Now
                      </Link>
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


export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
