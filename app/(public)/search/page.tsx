'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Star, Loader, Filter, X, Globe } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BRAIDER_FEATURED_IMAGES } from '@/lib/imageAssets';

interface Professional {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
  profession_type: string;
  state: string;
  city: string;
  country: string;
  payment_provider: string;
  verification_status: string;
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSupabaseAuthStore();

  const initialCountry = searchParams?.get('country')?.toUpperCase() || 'ALL';
  const initialProfession = searchParams?.get('profession') || '';
  const initialQuery = searchParams?.get('q') || searchParams?.get('style') || '';

  const [country, setCountry] = useState(initialCountry);
  const [profession, setProfession] = useState(initialProfession);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [minRating, setMinRating] = useState(0);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoading(true);

        // Try country-specific search first
        if (country !== 'ALL') {
          const params = new URLSearchParams({
            country,
            ...(profession && { profession }),
            ...(searchQuery && { q: searchQuery }),
            ...(minRating > 0 && { minRating: minRating.toString() }),
          });

          const response = await fetch(`/api/braiders/search?${params}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' },
          });
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setProfessionals(data);
            return;
          }
        }

        // Fallback: fetch all braiders
        const allParams = new URLSearchParams();
        if (country !== 'ALL') allParams.set('country', country);
        const allRes = await fetch(`/api/braiders?${allParams}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' },
        });
        let allData: Professional[] = await allRes.json();

        // Apply client-side filters
        if (profession) {
          allData = allData.filter(p =>
            profession === 'barber' ? p.profession_type === 'barber' : p.profession_type !== 'barber'
          );
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          allData = allData.filter(p =>
            p.full_name?.toLowerCase().includes(q) ||
            p.bio?.toLowerCase().includes(q) ||
            p.city?.toLowerCase().includes(q) ||
            p.state?.toLowerCase().includes(q)
          );
        }
        if (minRating > 0) {
          allData = allData.filter(p => p.rating_avg >= minRating);
        }

        setProfessionals(Array.isArray(allData) ? allData : []);
      } catch (error) {
        console.error('Search error:', error);
        setProfessionals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [country, profession, searchQuery, minRating]);

  const braiders = useMemo(() => professionals.filter(p => p.profession_type !== 'barber'), [professionals]);
  const barbers = useMemo(() => professionals.filter(p => p.profession_type === 'barber'), [professionals]);

  const ngCount = professionals.filter(p => (p.country || 'NG') === 'NG').length;
  const usCount = professionals.filter(p => p.country === 'US').length;

  const ProfCard = ({ pro, idx }: { pro: Professional; idx: number }) => {
    const isBarber = pro.profession_type === 'barber';
    const img = pro.avatar_url || BRAIDER_FEATURED_IMAGES[idx % BRAIDER_FEATURED_IMAGES.length]?.src;
    const isNG = (pro.country || 'NG') === 'NG';

    return (
      <div
        onClick={() => router.push(`/braider/${pro.user_id || pro.id}`)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex flex-col"
      >
        <div className="relative h-40 sm:h-44 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
          {img ? (
            <img src={img} alt={pro.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {isBarber ? '💈' : '✂️'}
            </div>
          )}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${isBarber ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {isBarber ? '💈 Barber' : '✂️ Braider'}
          </div>
          {/* Country + payment badge */}
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${isNG ? 'bg-green-600' : 'bg-blue-500'}`}>
            {isNG ? '🇳🇬 Paystack' : '🇺🇸 Stripe'}
          </div>
          {(pro.verification_status === 'verified' || pro.verification_status === 'approved') && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</div>
          )}
        </div>

        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 text-sm truncate">{pro.full_name}</h3>
          <div className="flex items-center gap-1 mt-0.5 mb-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">{pro.rating_avg ? pro.rating_avg.toFixed(1) : 'New'}</span>
            <span className="text-xs text-gray-400">({pro.rating_count || 0})</span>
          </div>
          {(pro.city || pro.state) && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{[pro.city, pro.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1 leading-relaxed">
            {pro.bio || `Professional ${isBarber ? 'barber' : 'braider'}`}
          </p>

          <div className="grid grid-cols-2 gap-1 mt-auto pt-2 border-t border-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/braider/${pro.user_id || pro.id}`); }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${isBarber ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
            >
              👤 Profile
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) { router.push('/login'); return; }
                router.push(`/booking?braider_id=${pro.user_id || pro.id}`);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${isBarber ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
            >
              📅 Book
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-3xl font-serif font-bold mb-2">
            {country === 'ALL' ? '🌍 All Professionals' : country === 'NG' ? '🇳🇬 Nigeria Professionals' : '🇺🇸 USA Professionals'}
          </h1>
          <p className="text-purple-100 text-sm mb-4">
            {country === 'NG' ? '💰 Payments via Paystack (NGN)' : country === 'US' ? '💳 Payments via Stripe (USD)' : `🇳🇬 ${ngCount} Nigeria • 🇺🇸 ${usCount} USA`}
            {' • '}{professionals.length} professional{professionals.length !== 1 ? 's' : ''} found
          </p>

          {/* Country selector pills */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { val: 'ALL', label: '🌍 All', active: 'bg-white text-purple-700' },
              { val: 'NG', label: '🇳🇬 Nigeria', active: 'bg-green-500 text-white' },
              { val: 'US', label: '🇺🇸 USA', active: 'bg-blue-500 text-white' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setCountry(opt.val)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${country === opt.val ? opt.active : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, city, or specialty..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm text-gray-900"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profession</label>
                <select value={profession} onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="">All Professionals</option>
                  <option value="braider">✂️ Braiders</option>
                  <option value="barber">💈 Barbers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Rating</label>
                <select value={minRating} onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="0">All ratings</option>
                  <option value="3">3+ ⭐</option>
                  <option value="4">4+ ⭐</option>
                  <option value="4.5">4.5+ ⭐</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setSearchQuery(''); setProfession(''); setMinRating(0); setCountry('ALL'); }}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 sm:p-12 text-center border border-gray-100">
            <Globe className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 mb-2 font-semibold">No professionals found</p>
            <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search query</p>
            <button onClick={() => { setSearchQuery(''); setProfession(''); setMinRating(0); setCountry('ALL'); }}
              className="inline-block px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {braiders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-4">✂️ Braiders ({braiders.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {braiders.map((pro, idx) => <ProfCard key={pro.id} pro={pro} idx={idx} />)}
                </div>
              </div>
            )}
            {barbers.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-4">💈 Barbers ({barbers.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {barbers.map((pro, idx) => <ProfCard key={pro.id} pro={pro} idx={idx + braiders.length} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 text-purple-600 animate-spin" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}