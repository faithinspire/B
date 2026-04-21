'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Shield, Users, Zap, CheckCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useBraiders } from '@/app/hooks/useBraiders';
import { BRAIDER_FEATURED_IMAGES } from '@/lib/imageAssets';
import { PremiumSearchModal } from '@/app/components/PremiumSearchModal';
import MarketplaceCarousel from '@/app/components/MarketplaceCarousel';

// Lazy load heavy below-fold components
const BackgroundAnimator = dynamicImport(() => import('@/app/components/BackgroundAnimator').then(m => ({ default: m.BackgroundAnimator })), { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900" /> });
const BraidingStylesGallery = dynamicImport(() => import('@/app/components/BraidingStylesGallery').then(m => ({ default: m.BraidingStylesGallery })), { ssr: false, loading: () => null });

// ─── Braiding style data ───────────────────────────────────────────────────
const BRAIDING_STYLES = [
  { name: 'Knotless Braids', emoji: '✨', color: 'from-purple-500 to-pink-500', query: 'knotless' },
  { name: 'Box Braids', emoji: '💜', color: 'from-indigo-500 to-purple-500', query: 'box_braids' },
  { name: 'Cornrows', emoji: '🌟', color: 'from-pink-500 to-rose-500', query: 'cornrows' },
  { name: 'Locs', emoji: '🔥', color: 'from-amber-500 to-orange-500', query: 'locs' },
  { name: 'Twists', emoji: '💫', color: 'from-teal-500 to-cyan-500', query: 'twists' },
  { name: 'Kids Braids', emoji: '🌈', color: 'from-green-500 to-emerald-500', query: 'kids' },
  { name: 'Faux Locs', emoji: '🎀', color: 'from-rose-500 to-pink-500', query: 'faux_locs' },
  { name: 'Goddess Braids', emoji: '👑', color: 'from-yellow-500 to-amber-500', query: 'goddess' },
];

const BARBING_STYLES = [
  { name: 'Skin Fade', emoji: '✂️', color: 'from-slate-600 to-gray-700', query: 'skin_fade' },
  { name: 'Low Cut', emoji: '💈', color: 'from-blue-600 to-indigo-600', query: 'low_cut' },
  { name: 'Afro Taper', emoji: '🎯', color: 'from-purple-600 to-violet-600', query: 'afro_taper' },
  { name: 'Waves', emoji: '🌊', color: 'from-cyan-600 to-blue-600', query: 'waves' },
  { name: 'Dreadlocks', emoji: '🦁', color: 'from-amber-600 to-yellow-600', query: 'dreadlocks' },
  { name: 'Line Up', emoji: '📐', color: 'from-green-600 to-teal-600', query: 'lineup' },
];

// ─── StyleCard component ───────────────────────────────────────────────────
function StyleCard({ name, emoji, color, onClick }: { name: string; emoji: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{ width: 140, height: 100 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90 group-hover:opacity-100 transition-opacity`} />
      <div className="relative flex flex-col items-center justify-center h-full gap-1 px-2">
        <span className="text-3xl">{emoji}</span>
        <span className="text-white font-semibold text-xs text-center leading-tight">{name}</span>
      </div>
    </button>
  );
}

// ─── ProfessionalCard component ────────────────────────────────────────────
function ProfessionalCard({ braider, idx }: { braider: any; idx: number }) {
  const img = braider.avatar_url || BRAIDER_FEATURED_IMAGES[idx % BRAIDER_FEATURED_IMAGES.length]?.src;
  return (
    <div className="flex-shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group" style={{ width: 220 }}>
      <div className="relative h-48 bg-gradient-to-br from-purple-200 to-pink-200 overflow-hidden">
        {img ? (
          <img src={img} alt={braider.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">💇</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{braider.bio || 'Professional braider'}</p>
        <div className="flex gap-2">
          <Link
            href={`/braider/${braider.user_id || braider.id}`}
            className="flex-1 text-center py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
          >
            View
          </Link>
          <Link
            href={`/booking?braider_id=${braider.user_id || braider.id}`}
            className="flex-1 text-center py-1.5 border-2 border-purple-600 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-50 transition-colors"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage(): JSX.Element {
  const router = useRouter();
  const { braiders, loading } = useBraiders();
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
                  <button key={c.val} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-semibold transition-all" onClick={() => handleModalSearch(c.val, location)}>
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
              <Link href="/signup/braider" className="px-8 py-3.5 bg-transparent border-2 border-white text-white rounded-2xl font-bold hover:bg-white/10 transition-all text-center">Join as Professional</Link>
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
            {BRAIDING_STYLES.map(s => <StyleCard key={s.query} {...s} onClick={() => router.push(`/search?style=${s.query}`)} />)}
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
            {BARBING_STYLES.map(s => <StyleCard key={s.query} {...s} onClick={() => router.push(`/search?style=${s.query}`)} />)}
          </div>
        </div>
      </section>

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
              {featuredBraiders.map((braider, idx) => <ProfessionalCard key={braider.user_id || braider.id} braider={braider} idx={idx} />)}
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
              <Link href="/signup/braider" className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all text-lg">Start Earning Today</Link>
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
                <li><button onClick={() => handleModalSearch('NG', '')} className="hover:text-white transition-colors flex items-center gap-2">🇳🇬 Nigeria</button></li>
                <li><button onClick={() => handleModalSearch('US', '')} className="hover:text-white transition-colors flex items-center gap-2">🇺🇸 United States</button></li>
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
