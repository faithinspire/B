'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Shield, Users, Zap, CheckCircle, ChevronLeft, ChevronRight, Calendar, Heart, Play } from 'lucide-react';
import { useBraiders } from '@/app/hooks/useBraiders';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BRAIDER_FEATURED_IMAGES } from '@/lib/imageAssets';
import { PremiumSearchModal } from '@/app/components/PremiumSearchModal';
import MarketplaceCarousel from '@/app/components/MarketplaceCarousel';

// Lazy load heavy below-fold components
const BackgroundAnimator = dynamicImport(() => import('@/app/components/BackgroundAnimator').then(m => ({ default: m.BackgroundAnimator })), { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900" /> });
const BraidingStylesGallery = dynamicImport(() => import('@/app/components/BraidingStylesGallery').then(m => ({ default: m.BraidingStylesGallery })), { ssr: false, loading: () => null });

// ─── Braiding style data ───────────────────────────────────────────────────
const BRAIDING_STYLES = [
  { name: 'Knotless Braids', image: '/images/braiding-styles/b_Long_knotless_braids.png', query: 'knotless' },
  { name: 'Box Braids', image: '/images/braiding-styles/b_Long_jumbo_box_braid.png', query: 'box_braids' },
  { name: 'Cornrows', image: '/images/braiding-styles/BRAIDER AND BARBER/CONCROW.jpeg', query: 'cornrows' },
  { name: 'Locs', image: '/images/braiding-styles/BRAIDER AND BARBER/DREADLOCK.png', query: 'locs' },
  { name: 'Twists', image: '/images/braiding-styles/BRAIDER AND BARBER/TWISTS.png', query: 'twists' },
  { name: 'Kids Braids', image: '/images/braiding-styles/BRAIDER AND BARBER/YOUNG GIRL BRAIDED HAIRSTYLE.jpeg', query: 'kids' },
  { name: 'Goddess Braids', image: '/images/braiding-styles/BRAIDER AND BARBER/GODESS BRAIDS.jpeg', query: 'goddess' },
  { name: 'Medium Knotless', image: '/images/braiding-styles/b_Medium_knotless_brai.png', query: 'knotless' },
];

const BARBING_STYLES = [
  { name: 'Skin Fade', image: '/images/braiding-styles/BRAIDER AND BARBER/SKIN FADE.jpeg', query: 'skin_fade' },
  { name: 'Low Cut', image: '/images/braiding-styles/BRAIDER AND BARBER/LOW CUT.jpeg', query: 'low_cut' },
  { name: 'Afro Taper', image: '/images/braiding-styles/BRAIDER AND BARBER/AFRO TAPER.jpeg', query: 'afro_taper' },
  { name: 'Waves', image: '/images/braiding-styles/BRAIDER AND BARBER/WAVES.jpeg', query: 'waves' },
  { name: 'Dreadlocks', image: '/images/braiding-styles/BRAIDER AND BARBER/DREAD.jpeg', query: 'dreadlocks' },
  { name: 'Line Up', image: '/images/braiding-styles/BRAIDER AND BARBER/LINE UP.jpeg', query: 'lineup' },
];

// ─── StyleCard component ───────────────────────────────────────────────────
function StyleCard({ name, image, onClick }: { name: string; image: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{ width: 140, height: 160 }}
    >
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      {/* Dark gradient overlay at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <span className="text-white font-semibold text-xs text-center leading-tight block drop-shadow">{name}</span>
      </div>
    </button>
  );
}

// ─── ProfessionalCard component ────────────────────────────────────────────
function ProfessionalCard({ braider, idx, currentUserId }: { braider: any; idx: number; currentUserId?: string }) {
  const img = braider.avatar_url || BRAIDER_FEATURED_IMAGES[idx % BRAIDER_FEATURED_IMAGES.length]?.src;
  const isBarber = braider.profession_type === 'barber';
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/followers?follower_id=${currentUserId}&following_id=${braider.user_id || braider.id}`)
      .then(r => r.json())
      .then(d => setIsFollowing((d.data?.length || 0) > 0))
      .catch(() => {});
  }, [currentUserId, braider.user_id, braider.id]);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) { window.location.href = '/login'; return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await fetch(`/api/followers?follower_id=${currentUserId}&following_id=${braider.user_id || braider.id}`, { method: 'DELETE' });
        setIsFollowing(false);
      } else {
        await fetch('/api/followers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower_id: currentUserId, following_id: braider.user_id || braider.id }),
        });
        setIsFollowing(true);
      }
    } catch {}
    setFollowLoading(false);
  };

  return (
    <div className="flex-shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group" style={{ width: 220 }}>
      <div className="relative h-48 bg-gradient-to-br from-purple-200 to-pink-200 overflow-hidden">
        {img ? (
          <img src={img} alt={braider.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{isBarber ? '💈' : '💇'}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Profession badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${isBarber ? 'bg-blue-600' : 'bg-purple-600'}`}>
          {isBarber ? '💈 Barber' : '✂️ Braider'}
        </div>
        {/* Follow button */}
        <button
          onClick={toggleFollow}
          disabled={followLoading}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isFollowing ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}
          title={isFollowing ? 'Unfollow' : 'Follow'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-gray-900">{braider.rating_avg ? braider.rating_avg.toFixed(1) : 'New'}</span>
          </div>
          {braider.verification_status === 'approved' || braider.verification_status === 'verified' ? (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>
          ) : null}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{braider.full_name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{braider.bio || `Professional ${isBarber ? 'barber' : 'braider'}`}</p>
        <div className="flex gap-2">
          <Link
            href={`/braider/${braider.user_id || braider.id}`}
            className={`flex-1 text-center py-1.5 text-white rounded-lg text-xs font-semibold transition-colors ${isBarber ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            View
          </Link>
          <Link
            href={`/booking?braider_id=${braider.user_id || braider.id}`}
            className={`flex-1 text-center py-1.5 border-2 rounded-lg text-xs font-semibold transition-colors ${isBarber ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-purple-600 text-purple-600 hover:bg-purple-50'}`}
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── StatusSection component ────────────────────────────────────────────────
function StatusSection({ braiders }: { braiders: any[] }) {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [viewingStatus, setViewingStatus] = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (braiders.length === 0) return;
    // Fetch statuses for all featured braiders
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/braider/status');
        if (res.ok) {
          const data = await res.json();
          setStatuses(data.data || []);
        }
      } catch {}
    };
    fetchStatuses();
  }, [braiders.length]);

  // Group statuses by braider
  const braiderStatusMap = statuses.reduce((acc: any, s: any) => {
    if (!acc[s.braider_id]) acc[s.braider_id] = [];
    acc[s.braider_id].push(s);
    return acc;
  }, {});

  const braidersWithStatus = braiders.filter(b => braiderStatusMap[b.user_id || b.id]?.length > 0);

  if (braidersWithStatus.length === 0) return null;

  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
          Live Status
        </h2>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {braidersWithStatus.map(braider => {
            const bStatuses = braiderStatusMap[braider.user_id || braider.id] || [];
            const latest = bStatuses[0];
            return (
              <button
                key={braider.user_id || braider.id}
                onClick={() => setViewingStatus({ braider, statuses: bStatuses, current: 0 })}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                      {braider.avatar_url ? (
                        <img src={braider.avatar_url} alt={braider.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-xl">
                          {braider.profession_type === 'barber' ? '💈' : '✂️'}
                        </div>
                      )}
                    </div>
                  </div>
                  {latest?.media_type === 'video' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Play className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium max-w-[64px] truncate">{braider.full_name?.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Viewer Modal */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setViewingStatus(null)}>
          <div className="relative w-full max-w-sm h-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
              {viewingStatus.statuses.map((_: any, i: number) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full ${i <= viewingStatus.current ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
            {/* Header */}
            <div className="absolute top-8 left-4 right-4 z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                {viewingStatus.braider.avatar_url
                  ? <img src={viewingStatus.braider.avatar_url} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-sm">{viewingStatus.braider.profession_type === 'barber' ? '💈' : '✂️'}</div>}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{viewingStatus.braider.full_name}</p>
                <p className="text-white/60 text-xs">{new Date(viewingStatus.statuses[viewingStatus.current]?.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              <button onClick={() => setViewingStatus(null)} className="ml-auto text-white/80 hover:text-white text-2xl font-light">✕</button>
            </div>
            {/* Media */}
            <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-900">
              {viewingStatus.statuses[viewingStatus.current]?.media_type === 'video' ? (
                <video
                  src={viewingStatus.statuses[viewingStatus.current]?.media_url}
                  autoPlay
                  className="w-full h-full object-cover"
                  onEnded={() => {
                    if (viewingStatus.current < viewingStatus.statuses.length - 1) {
                      setViewingStatus((v: any) => ({ ...v, current: v.current + 1 }));
                    } else {
                      setViewingStatus(null);
                    }
                  }}
                />
              ) : (
                <img
                  src={viewingStatus.statuses[viewingStatus.current]?.media_url}
                  alt="Status"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Caption */}
            {viewingStatus.statuses[viewingStatus.current]?.caption && (
              <div className="absolute bottom-8 left-4 right-4 bg-black/50 rounded-xl p-3">
                <p className="text-white text-sm">{viewingStatus.statuses[viewingStatus.current].caption}</p>
              </div>
            )}
            {/* Navigation */}
            <div className="absolute inset-0 flex">
              <div className="flex-1" onClick={() => {
                if (viewingStatus.current > 0) setViewingStatus((v: any) => ({ ...v, current: v.current - 1 }));
              }} />
              <div className="flex-1" onClick={() => {
                if (viewingStatus.current < viewingStatus.statuses.length - 1) {
                  setViewingStatus((v: any) => ({ ...v, current: v.current + 1 }));
                } else {
                  setViewingStatus(null);
                }
              }} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function LandingPage(): JSX.Element {
  const router = useRouter();
  const { braiders, loading } = useBraiders();
  const { user } = useSupabaseAuthStore();
  const [location, setLocation] = useState('');
  const [style, setStyle] = useState('');
  const [featuredBraiders, setFeaturedBraiders] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const braidingScrollRef = useRef<HTMLDivElement>(null);
  const barbingScrollRef = useRef<HTMLDivElement>(null);
  const profScrollRef = useRef<HTMLDivElement>(null);

  // Update featured braiders when braiders data loads
  useEffect(() => {
    if (!braiders || braiders.length === 0) { setFeaturedBraiders([]); return; }
    const featured = braiders
      .filter((b) => b && b.full_name && b.user_id)
      .sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0))
      .slice(0, 16);
    setFeaturedBraiders(featured);
  }, [braiders]);

  // Auto-rotate carousel (kept for future use)
  useEffect(() => {
    if (featuredBraiders.length === 0) return;
  }, [featuredBraiders.length]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (style) params.append('style', style);
    router.push(`/search?${params.toString()}`);
  };

  const handleModalSearch = (country: string, loc: string) => {
    const params = new URLSearchParams();
    params.append('location', loc);
    params.append('country', country);
    if (style) params.append('style', style);
    router.push(`/search?${params.toString()}`);
  };

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };
  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PremiumSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleModalSearch}
      />
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <BackgroundAnimator
            images={[
              '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png',
              '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png',
              '/images/braiding-styles/b_Professional_photo_o.png',
            ]}
            interval={5000}
            transitionDuration={1200}
            className="absolute inset-0 opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-pink-900/60 to-blue-900/70" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-yellow-400">✨</span>
              <span className="text-white text-sm font-medium">Nigeria 🇳🇬 &amp; USA 🇺🇸 — Verified Professionals</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight">
              Find Your Perfect<br />
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                Braider, Barber &amp; Stylist
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              Book trusted professionals with secure payments, verified credentials, and real-time tracking.
            </p>
          </div>

          {/* Glassmorphism Search Card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex gap-2 mb-4">
                {[{ flag: '🇳🇬', label: 'Nigeria', val: 'NG' }, { flag: '🇺🇸', label: 'USA', val: 'US' }].map(c => (
                  <button key={c.val} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-semibold transition-all" onClick={() => router.push(`/search?country=${c.val}`)}>
                    <span>{c.flag}</span> {c.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="City, state, or area..."
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm backdrop-blur-sm"
                  />
                </div>
                <div className="sm:w-44">
                  <select value={style} onChange={e => setStyle(e.target.value)} className="w-full px-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm backdrop-blur-sm">
                    <option value="" className="text-gray-900">All styles</option>
                    <option value="knotless" className="text-gray-900">Knotless</option>
                    <option value="box_braids" className="text-gray-900">Box Braids</option>
                    <option value="cornrows" className="text-gray-900">Cornrows</option>
                    <option value="locs" className="text-gray-900">Locs</option>
                    <option value="skin_fade" className="text-gray-900">Skin Fade</option>
                    <option value="waves" className="text-gray-900">Waves</option>
                  </select>
                </div>
                <button onClick={handleSearch} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap">
                  <Search className="w-5 h-5" /> Search
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Knotless', 'Box Braids', 'Cornrows', 'Skin Fade', 'Locs', 'Twists'].map(s => (
                  <button key={s} onClick={() => { setStyle(s.toLowerCase().replace(' ', '_')); setTimeout(handleSearch, 100); }} className="px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-white text-xs font-medium transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
              <Link href="/signup/customer" className="px-8 py-3.5 bg-white text-purple-700 rounded-2xl font-bold hover:shadow-xl transition-all text-center">Book a Professional</Link>
              <Link href="/signup" className="px-8 py-3.5 bg-transparent border-2 border-white text-white rounded-2xl font-bold hover:bg-white/10 transition-all text-center">Join as Braider or Barber</Link>
            </div>
          </div>
        </div>
      </section>

      {/* BRAIDING STYLES SLIDER */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">✂️ Braiding Styles</h2>
              <p className="text-gray-500 text-sm mt-1">Tap a style to find braiders who specialize in it</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollLeft(braidingScrollRef)} className="p-2 bg-gray-100 hover:bg-purple-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button onClick={() => scrollRight(braidingScrollRef)} className="p-2 bg-gray-100 hover:bg-purple-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
          <div ref={braidingScrollRef} className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {BRAIDING_STYLES.map(s => <StyleCard key={s.query} name={s.name} image={s.image} onClick={() => router.push(`/search?style=${s.query}`)} />)}
          </div>
        </div>
      </section>

      {/* BARBING STYLES SLIDER */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">💈 Barbing Styles</h2>
              <p className="text-gray-500 text-sm mt-1">Find barbers offering your preferred cut</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollLeft(barbingScrollRef)} className="p-2 bg-gray-100 hover:bg-blue-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button onClick={() => scrollRight(barbingScrollRef)} className="p-2 bg-gray-100 hover:bg-blue-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
          <div ref={barbingScrollRef} className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {BARBING_STYLES.map(s => <StyleCard key={s.query} name={s.name} image={s.image} onClick={() => router.push(`/search?style=${s.query}`)} />)}
          </div>
        </div>
      </section>

      {/* BRAIDER/BARBER STATUS — WhatsApp-style stories */}
      <StatusSection braiders={featuredBraiders} />

      {/* FEATURED PROFESSIONALS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">👑 Featured Professionals</h2>
              <p className="text-gray-500 text-sm mt-1">Top-rated braiders, barbers &amp; stylists</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex gap-2">
                <button onClick={() => scrollLeft(profScrollRef)} className="p-2 bg-gray-100 hover:bg-purple-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={() => scrollRight(profScrollRef)} className="p-2 bg-gray-100 hover:bg-purple-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
              <Link href="/search" className="text-purple-600 font-semibold text-sm hover:text-purple-700">View all →</Link>
            </div>
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="flex-shrink-0 bg-gray-100 rounded-2xl animate-pulse" style={{ width: 220, height: 320 }} />)}
            </div>
          ) : featuredBraiders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl">
              <p className="text-gray-500 text-lg mb-4">No professionals registered yet</p>
              <Link href="/signup/braider" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors">Be the first →</Link>
            </div>
          ) : (
            <div ref={profScrollRef} className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {featuredBraiders.map((braider, idx) => <ProfessionalCard key={braider.user_id || braider.id} braider={braider} idx={idx} currentUserId={user?.id} />)}
            </div>
          )}
        </div>
      </section>

      {/* MARKETPLACE */}
      <MarketplaceCarousel
        title="🛍 Marketplace — Hair Products &amp; Accessories"
        subtitle="Premium braiding supplies, extensions, and accessories from verified sellers"
      />

      {/* BRAIDING STYLES GALLERY */}
      <BraidingStylesGallery />

      {/* TRUST SECTION */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">Why Choose BraidMee?</h2>
            <p className="text-white/70 text-lg">Industry-leading protection and trust for every booking</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Shield, title: 'Secure Escrow', desc: 'Funds held safely until service is complete', emoji: '🔒' },
              { icon: Users, title: 'Verified Pros', desc: 'ID verified and background checked professionals', emoji: '✅' },
              { icon: Zap, title: 'SOS Safety', desc: 'Emergency alert button during every service', emoji: '🆘' },
              { icon: CheckCircle, title: 'Dispute Protection', desc: 'Full refund guarantee if issues arise', emoji: '🛡️' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">Book in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', icon: Search, title: 'Search & Discover', desc: 'Find braiders, barbers, and stylists by location, style, or rating', color: 'from-purple-500 to-pink-500' },
              { step: '02', icon: Calendar, title: 'Book & Pay Securely', desc: 'Choose your service, pick a time, and pay with Paystack or Stripe', color: 'from-pink-500 to-rose-500' },
              { step: '03', icon: CheckCircle, title: 'Get Styled', desc: 'Your professional arrives, you get styled, funds release automatically', color: 'from-blue-500 to-purple-500' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-purple-400 mb-2 tracking-widest">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-xl border border-purple-100">
            <div className="text-5xl mb-6">💰</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">Earn as a Professional</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of verified braiders, barbers &amp; stylists earning $50–$200+ per appointment with secure payments and flexible scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all text-lg">Start Earning Today</Link>
              <Link href="/search" className="px-10 py-4 border-2 border-purple-600 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 transition-all text-lg">Browse Professionals</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-xl font-serif font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">BraidMee</h3>
              <p className="text-gray-400 text-sm mb-4">Premium braiding, barbering &amp; styling platform for Nigeria 🇳🇬 and USA 🇺🇸</p>
              <div className="flex gap-3">
                <a href="https://wa.me/15164625071" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.946 1.347l-.355.192-.368-.06c-1.286-.264-2.514-.666-3.554-1.207l-.658-.38-.67.54c-1.704 1.38-2.77 3.117-2.77 5.034 0 1.595.392 3.127 1.139 4.533l.359.687-.864.254c-1.102.325-2.074.84-2.845 1.544l-.564.504.635.368c1.905 1.105 4.105 1.714 6.514 1.714 8.094 0 14.712-6.618 14.712-14.712 0-1.93-.37-3.774-1.039-5.459l-.261-.667.56-.358c1.902-1.217 3.557-2.773 4.778-4.57l.305-.45-.523-.301c-1.997-1.15-4.285-1.783-6.683-1.783z"/></svg>
                </a>
                <a href="mailto:Trulicares@gmail.com" className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/search" className="hover:text-white transition-colors">Find Professionals</Link></li>
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/signup/braider" className="hover:text-white transition-colors">Become a Pro</Link></li>
                <li><Link href="/premium" className="hover:text-white transition-colors">Premium</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://wa.me/15164625071" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Support</a></li>
                <li><a href="mailto:Trulicares@gmail.com" className="hover:text-white transition-colors">Email Us</a></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Countries</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => router.push('/search?country=NG')} className="hover:text-white transition-colors flex items-center gap-2">🇳🇬 Nigeria</button></li>
                <li><button onClick={() => router.push('/search?country=US')} className="hover:text-white transition-colors flex items-center gap-2">🇺🇸 United States</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; 2025 BraidMee. All rights reserved.</p>
            <p className="text-sm text-gray-500">Made with ❤️ for the African diaspora</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
