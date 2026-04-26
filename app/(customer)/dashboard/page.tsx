'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useBraiders } from '@/app/hooks/useBraiders';
import { Heart, Star, MapPin, Search, Loader, Calendar, Clock, ChevronRight } from 'lucide-react';
import { ReviewSubmissionModal } from '@/app/components/ReviewSubmissionModal';
import { createClient } from '@supabase/supabase-js';

export default function CustomerDashboard() {
  const router = useRouter();

  const sb = useMemo(() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return null;
      return createClient(url, key);
    } catch { return null; }
  }, []);

  const { user, loading: authLoading } = useSupabaseAuthStore();
  const { braiders } = useBraiders();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [filteredBraiders, setFilteredBraiders] = useState<any[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'customer') { router.push('/'); return; }

    const saved = localStorage.getItem(`favorites_${user.id}`);
    if (saved) setFavorites(JSON.parse(saved));

    if (!sb) return;
    sb.from('bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMyBookings(data); });
    sb.from('reviews').select('booking_id').eq('reviewer_id', user.id)
      .then(({ data }) => { if (data) setReviewedBookings(new Set(data.map((r: any) => r.booking_id))); });
  }, [user, authLoading, router, sb]);

  const filterProfessionals = useCallback(() => {
    setLoading(true);
    try {
      let results = braiders;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        results = results.filter(b =>
          b.full_name?.toLowerCase().includes(q) ||
          b.bio?.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q) ||
          b.state?.toLowerCase().includes(q) ||
          b.specialties?.some((s: string) => s.toLowerCase().includes(q))
        );
      }

      if (minRating > 0) {
        results = results.filter(b => b.rating_avg != null && b.rating_avg >= minRating);
      }

      // Split into braiders and barbers
      const braiderList = results.filter(b => b.profession_type !== 'barber');
      const barberList = results.filter(b => b.profession_type === 'barber');

      setFilteredBraiders(braiderList);
      setFilteredBarbers(barberList);
    } finally {
      setLoading(false);
    }
  }, [braiders, searchQuery, minRating]);

  useEffect(() => { filterProfessionals(); }, [filterProfessionals]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(updated));
      return updated;
    });
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Loader className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'customer') return null;

  // Professional card component
  const ProfCard = ({ pro }: { pro: any }) => {
    const isBarber = pro.profession_type === 'barber';
    const profileId = pro.user_id || pro.id;
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
        <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
          {pro.avatar_url ? (
            <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {isBarber ? '💈' : '💇'}
            </div>
          )}
          <button
            onClick={() => toggleFavorite(pro.id)}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${favorites.includes(pro.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${isBarber ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {isBarber ? '💈 Barber' : '✂️ Braider'}
          </div>
          {(pro.verification_status === 'verified' || pro.verification_status === 'approved') && (
            <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">✓</div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{pro.full_name}</h3>
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">{pro.rating_avg ? pro.rating_avg.toFixed(1) : 'New'}</span>
            <span className="text-xs text-gray-400">({pro.rating_count || 0})</span>
          </div>
          {(pro.city || pro.state) && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{[pro.city, pro.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{pro.bio || `Professional ${isBarber ? 'barber' : 'braider'}`}</p>
          <div className="flex gap-1.5 mt-auto">
            {/* View Profile - full page navigation to avoid auth glitch */}
            <a
              href={`/braider/${profileId}`}
              className={`flex-1 text-center py-1.5 text-white rounded-lg text-xs font-semibold transition-colors ${isBarber ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              Profile
            </a>
            {/* Chat button - starts direct conversation */}
            <a
              href={`/messages?braider_id=${profileId}&name=${encodeURIComponent(pro.full_name)}`}
              className="flex-1 text-center py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
            >
              💬 Chat
            </a>
            {/* Book button */}
            <a
              href={`/booking?braider_id=${profileId}`}
              className={`flex-1 text-center py-1.5 border-2 rounded-lg text-xs font-semibold transition-colors ${isBarber ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-purple-600 text-purple-600 hover:bg-purple-50'}`}
            >
              Book
            </a>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, subtitle, viewAllHref }: { title: string; subtitle: string; viewAllHref: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-serif font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
      </div>
      <a href={viewAllHref} className="text-purple-600 text-sm font-semibold hover:text-purple-700 flex items-center gap-1">
        View all <ChevronRight className="w-4 h-4" />
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-1">Welcome, {user.full_name?.split(' ')[0]}! 👋</h1>
          <p className="text-purple-100 text-sm">Find and book your perfect braider or barber</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 border border-gray-100">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'browse' ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            ✂️💈 Browse Professionals
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'bookings' ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Calendar className="w-4 h-4" />
            My Bookings {myBookings.length > 0 && <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{myBookings.length}</span>}
          </button>
        </div>

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <>
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, city, or specialty..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                </div>
                <select
                  value={minRating}
                  onChange={e => setMinRating(parseFloat(e.target.value))}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="0">All ratings</option>
                  <option value="3">3+ ⭐</option>
                  <option value="4">4+ ⭐</option>
                  <option value="4.5">4.5+ ⭐</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <a href="/search?profession=braider" className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold hover:bg-purple-200 transition-colors">
                  ✂️ All Braiders
                </a>
                <a href="/search?profession=barber" className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200 transition-colors">
                  💈 All Barbers
                </a>
                <a href="/search?country=NG" className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200 transition-colors">
                  🇳🇬 Nigeria
                </a>
                <a href="/search?country=US" className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-200 transition-colors">
                  🇺🇸 USA
                </a>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* BRAIDERS SECTION */}
                <div className="mb-10">
                  <SectionHeader
                    title="✂️ Braiders"
                    subtitle={`${filteredBraiders.length} braider${filteredBraiders.length !== 1 ? 's' : ''} available`}
                    viewAllHref="/search?profession=braider"
                  />
                  {filteredBraiders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <p className="text-gray-500 text-sm mb-3">No braiders found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
                      <a href="/search?profession=braider" className="text-purple-600 text-sm font-semibold hover:underline">Browse all braiders →</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredBraiders.slice(0, 10).map(pro => <ProfCard key={pro.id} pro={pro} />)}
                    </div>
                  )}
                </div>

                {/* BARBERS SECTION */}
                <div className="mb-10">
                  <SectionHeader
                    title="💈 Barbers"
                    subtitle={`${filteredBarbers.length} barber${filteredBarbers.length !== 1 ? 's' : ''} available`}
                    viewAllHref="/search?profession=barber"
                  />
                  {filteredBarbers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <p className="text-gray-500 text-sm mb-3">No barbers found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
                      <a href="/search?profession=barber" className="text-blue-600 text-sm font-semibold hover:underline">Browse all barbers →</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredBarbers.slice(0, 10).map(pro => <ProfCard key={pro.id} pro={pro} />)}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {myBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                <Calendar className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-600 mb-2 font-semibold">No bookings yet</p>
                <p className="text-gray-400 text-sm mb-4">Book a braider or barber to get started</p>
                <a href="/booking" className="inline-block px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors">
                  Book Now →
                </a>
              </div>
            ) : (
              myBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${
                    booking.status === 'confirmed' || booking.status === 'accepted' ? 'border-green-500'
                    : booking.status === 'completed' ? 'border-blue-500'
                    : booking.status === 'cancelled' ? 'border-red-500'
                    : 'border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{booking.braider_name || 'Professional'}</h3>
                      <p className="text-xs text-gray-500">{booking.service_name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      booking.status === 'confirmed' || booking.status === 'accepted' ? 'bg-green-100 text-green-700'
                      : booking.status === 'completed' ? 'bg-blue-100 text-blue-700'
                      : booking.status === 'cancelled' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1).replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.appointment_date ? new Date(booking.appointment_date).toLocaleDateString() : 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />${(booking.service_price || 0).toFixed(2)}</span>
                    {booking.location_address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.location_address}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(booking.status === 'confirmed' || booking.status === 'accepted' || booking.status === 'escrowed') && (
                      <a href={`/messages/${booking.id}`}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors">
                        💬 Chat
                      </a>
                    )}
                    {(booking.status === 'pending' || booking.status === 'pending_payment') && (
                      <a href={`/booking/${booking.id}`}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                        💳 Pay Now
                      </a>
                    )}
                    {booking.status === 'completed' && !reviewedBookings.has(booking.id) && (
                      <button onClick={() => setReviewBooking(booking)}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-1">
                        <Star className="w-3 h-3" /> Review
                      </button>
                    )}
                    {booking.status === 'completed' && reviewedBookings.has(booking.id) && (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold">✓ Reviewed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {reviewBooking && user && (
        <ReviewSubmissionModal
          bookingId={reviewBooking.id}
          braiderId={reviewBooking.braider_id}
          braiderName={reviewBooking.braider_name || 'Professional'}
          reviewerId={user.id}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewedBookings(prev => new Set([...prev, reviewBooking.id]));
            setReviewBooking(null);
          }}
        />
      )}
    </div>
  );
}
