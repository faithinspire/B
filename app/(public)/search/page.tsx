'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBraiders } from '@/app/hooks/useBraiders';
import { Star, MapPin, Filter, Crown, Search } from 'lucide-react';

interface Professional {
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
  specialization?: string;
  is_premium?: boolean;
  featured_order?: number;
  profession_type?: string; // 'braider' | 'barber'
  country?: string;
  state?: string;
  city?: string;
  services: Array<{ price: number }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { braiders: allProfessionals, loading: initialLoading } = useBraiders();
  const [results, setResults] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [searchInput, setSearchInput] = useState(searchParams?.get('location') || '');

  // Active filters (derived from URL + local state)
  const [activeCountry, setActiveCountry] = useState<string>(searchParams?.get('country') || '');
  const [activeProfession, setActiveProfession] = useState<string>(searchParams?.get('profession') || '');
  const [filters, setFilters] = useState({
    minRating: 0,
    maxPrice: 500,
    verified: false,
    premiumOnly: false,
  });

  // Re-run whenever URL params or filter state changes
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filters, activeCountry, activeProfession, allProfessionals]);

  const applyFilters = () => {
    setLoading(true);
    try {
      let data = allProfessionals as Professional[];

      // Country filter
      if (activeCountry) {
        data = data.filter(p => p.country === activeCountry);
      }

      // Profession type filter
      if (activeProfession === 'braider') {
        data = data.filter(p => !p.profession_type || p.profession_type === 'braider');
      } else if (activeProfession === 'barber') {
        data = data.filter(p => p.profession_type === 'barber');
      }

      // Verified filter
      if (filters.verified) {
        data = data.filter(p => p.verification_status === 'verified');
      }

      // Premium filter
      if (filters.premiumOnly) {
        data = data.filter(p => p.is_premium);
      }

      // Rating filter
      if (filters.minRating > 0) {
        data = data.filter(p => p.rating_avg != null && p.rating_avg >= filters.minRating);
      }

      // Price filter
      data = data.filter(p => {
        if (!p.services || p.services.length === 0) return true;
        const minPrice = Math.min(...p.services.map(s => s.price));
        return minPrice <= filters.maxPrice;
      });

      // Location / style text search
      const location = searchParams?.get('location') || searchInput;
      const style = searchParams?.get('style');

      if (location) {
        const q = location.toLowerCase();
        data = data.filter(p =>
          p.state?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.full_name.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q)
        );
      }

      if (style) {
        data = data.filter(p =>
          p.specialties?.some((s: string) => s.toLowerCase().includes(style.toLowerCase())) ||
          p.specialization?.toLowerCase().includes(style.toLowerCase())
        );
      }

      // Sort: premium first, then rating
      data.sort((a, b) => {
        if (a.is_premium && !b.is_premium) return -1;
        if (!a.is_premium && b.is_premium) return 1;
        if (a.is_premium && b.is_premium) return (b.featured_order || 0) - (a.featured_order || 0);
        return (b.rating_avg || 0) - (a.rating_avg || 0);
      });

      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set('location', searchInput);
    if (activeCountry) params.set('country', activeCountry);
    if (activeProfession) params.set('profession', activeProfession);
    router.push(`/search?${params.toString()}`);
  };

  const toggleCountry = (code: string) => {
    const next = activeCountry === code ? '' : code;
    setActiveCountry(next);
  };

  const toggleProfession = (type: string) => {
    const next = activeProfession === type ? '' : type;
    setActiveProfession(next);
  };

  const professionLabel = (p: Professional) => {
    if (p.profession_type === 'barber') return '💈 Barber';
    return '✂️ Braider';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="text-xl font-serif font-bold text-purple-600 shrink-0">BraidMee</Link>
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by city, state, or name..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <button onClick={handleSearch}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Quick filter pills */}
          <div className="flex flex-wrap gap-2">
            {/* Country pills */}
            <button
              onClick={() => toggleCountry('NG')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCountry === 'NG'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
              }`}
            >
              🇳🇬 Nigeria
            </button>
            <button
              onClick={() => toggleCountry('US')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCountry === 'US'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              🇺🇸 USA
            </button>

            <span className="w-px bg-gray-200 self-stretch mx-1" />

            {/* Profession pills */}
            <button
              onClick={() => toggleProfession('braider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeProfession === 'braider'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500'
              }`}
            >
              ✂️ Braiders
            </button>
            <button
              onClick={() => toggleProfession('barber')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeProfession === 'barber'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              💈 Barbers
            </button>

            {/* Active filter summary */}
            {(activeCountry || activeProfession) && (
              <button
                onClick={() => { setActiveCountry(''); setActiveProfession(''); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
              >
                ✕ Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-36">
              <div className="flex items-center gap-2 mb-5">
                <Filter className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-sm">Filters</h2>
              </div>

              <div className="space-y-5">
                {/* Price Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Max Price</label>
                  <input type="range" min="0" max="500" value={filters.maxPrice}
                    onChange={e => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                    className="w-full accent-purple-600" />
                  <p className="text-xs text-gray-500 mt-1">Up to ${filters.maxPrice}</p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Min Rating</label>
                  <select value={filters.minRating}
                    onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="0">All ratings</option>
                    <option value="3">3+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>

                {/* Verified */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.verified}
                    onChange={e => setFilters({ ...filters, verified: e.target.checked })}
                    className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Verified Only</span>
                </label>

                {/* Premium */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.premiumOnly}
                    onChange={e => setFilters({ ...filters, premiumOnly: e.target.checked })}
                    className="w-4 h-4 accent-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-500" /> Premium Only
                  </span>
                </label>
              </div>

              {/* Result count */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {loading ? 'Searching...' : `${results.length} professional${results.length !== 1 ? 's' : ''} found`}
                </p>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {/* Context header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-gray-900">
                {activeProfession === 'barber' ? '💈 Barbers' : activeProfession === 'braider' ? '✂️ Braiders' : '✂️💈 Braiders & Barbers'}
                {activeCountry === 'NG' ? ' in Nigeria 🇳🇬' : activeCountry === 'US' ? ' in USA 🇺🇸' : ''}
              </h1>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg mb-2">No professionals found</p>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search in a different area</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={() => { setActiveCountry('NG'); setActiveProfession(''); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                    🇳🇬 Browse Nigeria
                  </button>
                  <button onClick={() => { setActiveCountry('US'); setActiveProfession(''); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                    🇺🇸 Browse USA
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((pro) => (
                  <Link key={pro.id} href={`/braider/${pro.user_id || pro.id}`}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group">
                    {/* Photo */}
                    <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                      {pro.avatar_url ? (
                        <img src={pro.avatar_url} alt={pro.full_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {pro.profession_type === 'barber' ? '💈' : '💇'}
                        </div>
                      )}
                      {/* Profession badge */}
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                        pro.profession_type === 'barber' ? 'bg-blue-600' : 'bg-purple-600'
                      }`}>
                        {professionLabel(pro)}
                      </div>
                      {pro.is_premium && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          <Crown className="w-3 h-3" /> Premium
                        </div>
                      )}
                      {/* Country flag */}
                      {pro.country && (
                        <div className="absolute bottom-2 right-2 text-lg">
                          {pro.country === 'NG' ? '🇳🇬' : pro.country === 'US' ? '🇺🇸' : ''}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{pro.full_name}</h3>

                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold text-gray-900">
                          {pro.rating_avg ? pro.rating_avg.toFixed(1) : 'New'}
                        </span>
                        <span className="text-xs text-gray-400">({pro.rating_count || 0})</span>
                        {pro.verification_status === 'verified' && (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>
                        )}
                      </div>

                      {pro.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{pro.city}{pro.state ? `, ${pro.state}` : ''}</span>
                        </div>
                      )}

                      <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">{pro.bio || 'Professional stylist'}</p>

                      <div className="flex gap-2 mt-auto">
                        <Link href={`/braider/${pro.user_id || pro.id}`}
                          className="flex-1 text-center py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors">
                          View Profile
                        </Link>
                        <Link href={`/booking?braider_id=${pro.user_id || pro.id}`}
                          className="flex-1 text-center py-2 border-2 border-purple-600 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-50 transition-colors">
                          Book
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
