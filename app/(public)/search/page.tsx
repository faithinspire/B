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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-serif font-bold text-primary-600 mb-4 block">
            Braidly
          </Link>
          <h1 className="text-2xl font-bold">Search Results</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5" />
                <h2 className="font-semibold">Filters</h2>
              </div>

              <div className="space-y-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600">Up to ${filters.maxPrice}</p>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    className="input-field"
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
                    <span className="text-sm font-medium">Verified Only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-20 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : braiders.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-600 text-lg">No braiders found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {braiders.map((braider) => (
                  <Link
                    key={braider.id}
                    href={`/braider/${braider.user_id || braider.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex gap-6"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-200 to-accent-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {braider.avatar_url ? (
                        <img src={braider.avatar_url} alt={braider.full_name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-3xl">💇</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{braider.full_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{braider.rating_avg.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({braider.rating_count} reviews)</span>
                          </div>
                        </div>
                        {braider.verification_status !== 'unverified' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{braider.bio}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{braider.travel_radius_miles} miles</span>
                          </div>
                          <span>From ${braider.services.length > 0 ? Math.min(...braider.services.map(s => s.price)).toFixed(2) : 'N/A'}</span>
                        </div>
                        <Link href={`/booking`} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-sm font-semibold">
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
