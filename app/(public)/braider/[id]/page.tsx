'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Star, MapPin, Clock, Shield, ChevronRight, AlertCircle, Crown,
  Instagram, Calendar, Bookmark, Play, Image as ImageIcon,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_id: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  title?: string;
  description?: string;
}

interface BraiderProfile {
  id: string;
  user_id: string;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  verification_status: string;
  travel_radius_miles: number;
  is_mobile: boolean;
  salon_address: string | null;
  full_name: string;
  avatar_url: string | null;
  specialties: string[];
  specialization: string | null;
  profession_type: string;
  state: string | null;
  city: string | null;
  country: string | null;
  experience_years: number;
  is_premium?: boolean;
  total_bookings: number;
  instagram_url: string | null;
  tiktok_url: string | null;
  portfolio_media: MediaItem[];
  services: Service[];
  reviews: Review[];
}

const TikTokIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

export default function BraiderProfilePage() {
  const params = useParams();
  const [pro, setPro] = useState<BraiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews'>('services');
  const [lightboxMedia, setLightboxMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    // Fetch profile - public page, no auth required
    if (params?.id) {
      fetchProfile(params.id as string);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/braiders/' + id, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Professional not found');
        return;
      }
      const data = await res.json();
      if (!data || (!data.id && !data.user_id)) {
        setError('Profile not found');
        return;
      }
      setPro({
        id: data.id || data.user_id,
        user_id: data.user_id || data.id,
        bio: data.bio || null,
        rating_avg: data.rating_avg || 0,
        rating_count: data.rating_count || 0,
        verification_status: data.verification_status || 'unverified',
        travel_radius_miles: data.travel_radius_miles || 10,
        is_mobile: data.is_mobile || false,
        salon_address: data.salon_address || null,
        full_name: data.full_name || 'Professional',
        avatar_url: data.avatar_url || null,
        specialties: data.specialties || [],
        specialization: data.specialization || null,
        profession_type: data.profession_type || 'braider',
        state: data.state || null,
        city: data.city || null,
        country: data.country || null,
        experience_years: data.experience_years || 0,
        is_premium: data.is_premium || false,
        total_bookings: data.total_bookings || 0,
        instagram_url: data.instagram_url || null,
        tiktok_url: data.tiktok_url || null,
        portfolio_media: data.portfolio_media || [],
        services: data.services || [],
        reviews: data.reviews || [],
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isBarber = pro?.profession_type === 'barber';
  const professionEmoji = isBarber ? '💈' : '✂️';
  const professionLabel = isBarber ? 'Barber' : 'Braider';
  const countryFlag = pro?.country === 'NG' ? '🇳🇬' : pro?.country === 'US' ? '🇺🇸' : '';
  const locationStr = [pro?.city, pro?.state, countryFlag].filter(Boolean).join(', ');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!pro || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold mb-2">{error || 'Profile not found'}</p>
          <a href="/search" className="inline-block mt-4 px-6 py-3 bg-white text-purple-700 rounded-xl font-bold hover:shadow-xl transition-all">
            Back to Search
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4">
          <a href="/search" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Search
          </a>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-16">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 border-4 border-white shadow-xl">
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">{professionEmoji}</div>
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg ${isBarber ? 'bg-blue-600' : 'bg-purple-600'}`}>
                  {professionEmoji} {professionLabel}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">{pro.full_name}</h1>
                    {locationStr && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{locationStr}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pro.is_premium && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    )}
                    {(pro.verification_status === 'verified' || pro.verification_status === 'approved') && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ Verified</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900">{pro.rating_avg ? pro.rating_avg.toFixed(1) : 'New'}</span>
                    {pro.rating_count > 0 && <span className="text-gray-500 text-sm">({pro.rating_count} reviews)</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span><strong className="text-gray-900">{pro.total_bookings}</strong> bookings</span>
                  </div>
                  {pro.experience_years > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <Bookmark className="w-4 h-4" />
                      <span><strong className="text-gray-900">{pro.experience_years}</strong> yrs exp</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                    <Shield className="w-4 h-4" />
                    <span>{pro.is_mobile ? 'Mobile Service' : 'Salon Based'}</span>
                  </div>
                </div>

                {pro.bio && <p className="text-gray-600 text-sm leading-relaxed mb-3">{pro.bio}</p>}

                {(pro.specialties?.length > 0 || pro.specialization) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {pro.specialization && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isBarber ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {pro.specialization}
                      </span>
                    )}
                    {pro.specialties?.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  {pro.instagram_url && (
                    <a href={pro.instagram_url.startsWith('http') ? pro.instagram_url : `https://instagram.com/${pro.instagram_url.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all">
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </a>
                  )}
                  {pro.tiktok_url && (
                    <a href={pro.tiktok_url.startsWith('http') ? pro.tiktok_url : `https://tiktok.com/@${pro.tiktok_url.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all">
                      <TikTokIcon /> TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href={`/booking?braider_id=${pro.user_id}`}
                className={`flex-1 text-center py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg hover:shadow-xl transition-all ${isBarber ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
                📅 Book {professionLabel}{pro.services.length > 0 ? ` — From $${Math.min(...pro.services.map(s => s.price)).toFixed(0)}` : ''}
              </a>
              <a href={`/messages?braider_id=${pro.user_id}&name=${encodeURIComponent(pro.full_name)}`}
                className="flex-1 text-center py-3.5 rounded-2xl font-bold text-gray-700 text-sm border-2 border-gray-200 hover:border-purple-400 hover:text-purple-600 transition-all">
                💬 Message {professionLabel}
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-100">
            <div className="flex">
              {(['services', 'portfolio', 'reviews'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-all border-b-2 ${
                    activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab === 'services' && `Services (${pro.services.length})`}
                  {tab === 'portfolio' && `Portfolio (${pro.portfolio_media.length})`}
                  {tab === 'reviews' && `Reviews (${pro.rating_count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'services' && (
              <div>
                {pro.services.length > 0 ? (
                  <div className="space-y-3">
                    {pro.services.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-purple-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">{service.name}</h3>
                          {service.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{service.description}</p>}
                          <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <Clock className="w-3 h-3" /> {service.duration_minutes} min
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className={`text-lg font-bold ${isBarber ? 'text-blue-600' : 'text-purple-600'}`}>
                            ${service.price.toFixed(0)}
                          </span>
                          <a href={`/booking?braider_id=${pro.user_id}&service_id=${service.id}`}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all ${isBarber ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                            Book
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">{professionEmoji}</div>
                    <p>No services listed yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div>
                {pro.portfolio_media.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {pro.portfolio_media.map((item, i) => (
                      <button key={i} onClick={() => setLightboxMedia(item)}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group hover:shadow-lg transition-all">
                        {item.type === 'video' ? (
                          <>
                            <video src={item.url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-10 h-10 text-white drop-shadow-lg" />
                            </div>
                          </>
                        ) : (
                          <img src={item.url} alt={item.title || `Portfolio ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                        {item.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs font-medium truncate">{item.title}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No portfolio items yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {pro.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {pro.reviews.map(review => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">Verified Customer</span>
                        </div>
                        {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No reviews yet — be the first to book!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxMedia(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light">✕</button>
          {lightboxMedia.type === 'video' ? (
            <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl" onClick={e => e.stopPropagation()} />
          ) : (
            <img src={lightboxMedia.url} alt={lightboxMedia.title || 'Portfolio'} className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
          )}
          {lightboxMedia.title && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {lightboxMedia.title}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
