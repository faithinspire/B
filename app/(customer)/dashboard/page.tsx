'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useBraiders } from '@/app/hooks/useBraiders';
import { Heart, Star, MapPin, Search, Loader, Calendar, Clock, AlertCircle } from 'lucide-react';
import { ReviewSubmissionModal } from '@/app/components/ReviewSubmissionModal';
import { createClient } from '@supabase/supabase-js';

export default function CustomerDashboard() {
  const router = useRouter();
  
  // Create Supabase client inside component to avoid build-time errors
  const sb = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const { braiders } = useBraiders();
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [filteredBraiders, setFilteredBraiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

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
    if (saved) setFavorites(JSON.parse(saved));
    
    // Load bookings from Supabase
    sb.from('bookings')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setMyBookings(data);
      });

    // Load already-reviewed bookings
    sb.from('reviews')
      .select('booking_id')
      .eq('reviewer_id', user.id)
      .then(({ data }) => {
        if (data) setReviewedBookings(new Set(data.map((r: any) => r.booking_id)));
      });
  }, [user, authLoading, router]);

  // Filter and search braiders in real-time
  const filterBraiders = useCallback(() => {
    setLoading(true);
    try {
      let results = braiders;

      // Search filter
      if (searchQuery) {
        results = results.filter(
          (b) =>
            b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.specialties && b.specialties.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())))
        );
      }

      // Specialty filter
      if (selectedSpecialty) {
        results = results.filter((b) => b.specialties && b.specialties.includes(selectedSpecialty));
      }

      // Rating filter — skip braiders with no ratings if minRating > 0
      results = results.filter((b) => minRating === 0 || (b.rating_avg != null && b.rating_avg >= minRating));

      // Price filter
      results = results.filter((b) => {
        if (!b.services || b.services.length === 0) return true;
        const minPrice = Math.min(...b.services.map((s: any) => s.price));
        return minPrice <= maxPrice;
      });

      setFilteredBraiders(results);
    } finally {
      setLoading(false);
    }
  }, [braiders, searchQuery, selectedSpecialty, minRating, maxPrice]);

  useEffect(() => {
    filterBraiders();
  }, [filterBraiders]);

  const toggleFavorite = useCallback((braider_id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(braider_id)
        ? prev.filter((id) => id !== braider_id)
        : [...prev, braider_id];
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(updated));
      return updated;
    });
  }, [user?.id]);

  if (!user || user.role !== 'customer') {
    return null;
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const specialties = ['Box Braids', 'Knotless', 'Cornrows', 'Locs', 'Twists', 'Kids Braids'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24" style={{ paddingTop: 0, marginTop: 0 }}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-6 sm:py-8 md:py-12 px-3 sm:px-4" style={{ marginTop: 0 }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-1 sm:mb-2">Welcome, {user.full_name}!</h1>
          <p className="text-primary-100 text-xs sm:text-sm md:text-lg">Find and book your perfect braider</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold transition-smooth border-b-2 text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'browse'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse Braiders
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold transition-smooth border-b-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 sm:w-5 h-3.5 sm:h-5" />
            My Bookings {myBookings.length > 0 && `(${myBookings.length})`}
          </button>
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Search & Filters */}
            <div className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl shadow-lg p-3 sm:p-4 md:p-6 mb-6 sm:mb-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-2.5 sm:top-3.5 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or specialty..."
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary-600 transition-smooth text-xs sm:text-sm md:text-base"
                    />
                  </div>
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Specialty</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary-600 text-xs sm:text-sm md:text-base"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map((s: string) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Min Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary-600 text-xs sm:text-sm md:text-base"
                  >
                    <option value="0">All ratings</option>
                    <option value="3">3+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Max Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary-600 text-xs sm:text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  {loading ? 'Filtering...' : `Found ${filteredBraiders.length} braiders`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecialty('');
                    setMinRating(0);
                    setMaxPrice(500);
                  }}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-xs sm:text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader className="w-6 sm:w-8 h-6 sm:h-8 text-primary-600 animate-spin" />
              </div>
            ) : filteredBraiders.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
                <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">No braiders found matching your criteria</p>
                <Link href="/search" className="text-primary-600 font-semibold hover:text-primary-700 text-xs sm:text-sm md:text-base">
                  Browse all braiders →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredBraiders.map((braider, idx) => (
                  <div
                    key={braider.id}
                    className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-smooth animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Image */}
                    <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary-200 to-accent-200">
                      {braider.avatar_url && (
                        <img
                          src={braider.avatar_url}
                          alt={braider.full_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => toggleFavorite(braider.id)}
                        className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 p-1.5 sm:p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-smooth"
                      >
                        <Heart
                          className={`w-4 sm:w-5 h-4 sm:h-5 ${
                            favorites.includes(braider.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 md:p-6">
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <div>
                          <h3 className="text-sm sm:text-base md:text-xl font-semibold text-gray-900">{braider.full_name}</h3>
                          <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                            <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-medium">
                              {braider.rating_avg ? braider.rating_avg.toFixed(1) : 'New'}
                            </span>
                            <span className="text-xs text-gray-500">({braider.rating_count || 0})</span>
                          </div>
                        </div>
                        {braider.verification_status === 'verified' && (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{braider.bio}</p>

                      <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                          <span>{braider.travel_radius_miles} miles radius</span>
                        </div>
                        {braider.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {braider.specialties.slice(0, 2).map((specialty: string) => (
                              <span key={specialty} className="px-1.5 sm:px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {braider.services.length > 0 && (
                        <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Services from:</p>
                          <p className="text-base sm:text-lg font-bold text-primary-600">
                            ${Math.min(...braider.services.map((service: any) => service.price)).toFixed(2)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-1.5 sm:gap-2">
                        <Link
                          href={`/braider/${braider.user_id || braider.id}`}
                          className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-center font-semibold text-xs sm:text-sm"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/braider/${braider.user_id || braider.id}`}
                          className="px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-smooth font-semibold text-xs sm:text-sm"
                        >
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {myBookings.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
                <Calendar className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">No bookings yet</p>
                <Link href="/booking" className="text-primary-600 font-semibold hover:text-primary-700 text-xs sm:text-sm md:text-base">
                  Book your first appointment →
                </Link>
              </div>
            ) : (
              myBookings.map((booking, idx) => (
                <div
                  key={booking.id}
                  className={`bg-white rounded-lg sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 hover:shadow-xl transition-smooth animate-slide-up border-l-4 ${
                    booking.status === 'confirmed'
                      ? 'border-green-500'
                      : booking.status === 'completed'
                      ? 'border-blue-500'
                      : booking.status === 'cancelled'
                      ? 'border-red-500'
                      : 'border-yellow-500'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{booking.braider_name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{booking.service_name}</p>
                    </div>
                    <span
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span>{booking.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span>{booking.appointment_date} • ${booking.service_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span>{booking.location_address}</span>
                    </div>
                    {booking.notes && (
                      <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-gray-50 rounded text-xs">
                        <p className="font-semibold text-gray-700">Notes:</p>
                        <p>{booking.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 md:pt-4 border-t border-gray-200 flex-wrap">
                    {(booking.status === 'confirmed' || booking.status === 'accepted' || booking.status === 'escrowed') && (
                      <Link
                        href={`/messages/${booking.id}`}
                        className="flex-1 min-w-[120px] px-2 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-center font-semibold text-xs sm:text-sm"
                      >
                        Chat with Braider
                      </Link>
                    )}
                    {booking.status === 'pending' && (
                      <Link
                        href={`/booking/${booking.id}`}
                        className="flex-1 min-w-[120px] px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth text-center font-semibold text-xs sm:text-sm"
                      >
                        Pay Now
                      </Link>
                    )}
                    {booking.status === 'completed' && !reviewedBookings.has(booking.id) && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="flex-1 min-w-[120px] px-2 sm:px-4 py-1.5 sm:py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-smooth font-semibold text-xs sm:text-sm flex items-center justify-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" /> Leave Review
                      </button>
                    )}
                    {booking.status === 'completed' && reviewedBookings.has(booking.id) && (
                      <span className="flex-1 min-w-[120px] px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-500 rounded-lg text-center font-semibold text-xs sm:text-sm">
                        ✓ Reviewed
                      </span>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        className="px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-smooth font-semibold text-xs sm:text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && user && (
        <ReviewSubmissionModal
          bookingId={reviewBooking.id}
          braiderId={reviewBooking.braider_id}
          braiderName={reviewBooking.braider_name || 'Braider'}
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
