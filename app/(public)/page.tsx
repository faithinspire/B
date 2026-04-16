'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Shield, Users, Zap, CheckCircle } from 'lucide-react';
import { useBraiders } from '@/app/hooks/useBraiders';
import { BRAIDER_FEATURED_IMAGES } from '@/lib/imageAssets';
import { PremiumSearchModal } from '@/app/components/PremiumSearchModal';
import MarketplaceCarousel from '@/app/components/MarketplaceCarousel';

// Lazy load heavy below-fold components
const BackgroundAnimator = dynamicImport(() => import('@/app/components/BackgroundAnimator').then(m => ({ default: m.BackgroundAnimator })), { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50" /> });
const BraidingStylesGallery = dynamicImport(() => import('@/app/components/BraidingStylesGallery').then(m => ({ default: m.BraidingStylesGallery })), { ssr: false, loading: () => null });

export default function LandingPage(): JSX.Element {
  const router = useRouter();
  const { braiders, loading } = useBraiders();
  const [location, setLocation] = useState('');
  const [style, setStyle] = useState('');
  const [featuredBraiders, setFeaturedBraiders] = useState<any[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Update featured braiders when braiders data loads
  useEffect(() => {
    try {
      console.log('=== HOMEPAGE: Braiders data received ===', { count: braiders.length, braiders });
      
      if (!braiders || braiders.length === 0) {
        console.warn('=== HOMEPAGE: No braiders data! ===');
        setFeaturedBraiders([]);
        return;
      }
      
      const featured = braiders
        .filter((b) => b && b.full_name && b.user_id)
        .sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0))
        .slice(0, 12);
      
      console.log('=== HOMEPAGE: Featured braiders after filter ===', { count: featured.length, featured });
      setFeaturedBraiders(featured);
    } catch (error) {
      console.error('=== HOMEPAGE: Error loading braiders ===', error);
      setFeaturedBraiders([]);
    }
  }, [braiders]);

  // Auto-rotate carousel
  useEffect(() => {
    if (featuredBraiders.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % Math.ceil(featuredBraiders.length / 4));
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredBraiders.length]);

  const handlePrevCarousel = () => {
    setCurrentCarouselIndex((prev) => 
      prev === 0 ? Math.ceil(featuredBraiders.length / 4) - 1 : prev - 1
    );
  };

  const handleNextCarousel = () => {
    setCurrentCarouselIndex((prev) => (prev + 1) % Math.ceil(featuredBraiders.length / 4));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (style) params.append('style', style);
    router.push(`/search?${params.toString()}`);
  };

  const handleModalSearch = (country: string, location: string) => {
    setLocation(location);
    const params = new URLSearchParams();
    params.append('location', location);
    params.append('country', country);
    if (style) params.append('style', style);
    router.push(`/search?${params.toString()}`);
  };

  const categories = [
    { name: 'Box Braids', value: 'box_braids' },
    { name: 'Knotless', value: 'knotless' },
    { name: 'Cornrows', value: 'cornrows' },
    { name: 'Locs', value: 'locs' },
    { name: 'Twists', value: 'twists' },
    { name: 'Kids', value: 'kids' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PremiumSearchModal 
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleModalSearch}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-24 lg:py-32" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(236, 72, 153, 0.1) 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient 8s ease infinite'
      }}>
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundAnimator
            images={[
              '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png',
              '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png',
              '/images/braiding-styles/b_Professional_photo_o.png',
            ]}
            interval={5000}
            transitionDuration={1000}
            className="absolute inset-0 opacity-40"
          />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-gray-900 mb-6 leading-tight">
              Premium Braiding,{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Verified Professionals
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Book trusted braiders with secure payments, verified credentials, and 48-hour escrow protection. Join thousands of satisfied customers.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 mb-8 sm:mb-12 animate-slide-up animate-delay-200">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Find Braiders</p>
            
            {/* Premium Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full mb-4 px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
              <span>Find Braiders by Location</span>
              <span className="text-2xl group-hover:scale-110 transition-transform">→</span>
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or search manually</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="City, zip code, or area..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-smooth text-sm sm:text-base"
                />
              </div>
              <div className="sm:w-52">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-smooth text-sm sm:text-base text-gray-700"
                >
                  <option value="">All styles</option>
                  <option value="box_braids">Box Braids</option>
                  <option value="knotless">Knotless</option>
                  <option value="cornrows">Cornrows</option>
                  <option value="locs">Locs</option>
                  <option value="twists">Twists</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-smooth flex items-center justify-center gap-2 px-6 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap"
              >
                <Search className="w-4 sm:w-5 h-4 sm:h-5" />
                Find Braiders
              </button>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 space-y-3">
              <Link
                href="/signup/braider"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-4 bg-secondary-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-secondary-700 hover:shadow-lg transition-smooth"
              >
                Become a Braider
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm sm:text-base font-semibold hover:border-primary-400 hover:text-primary-600 transition-smooth"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-8 animate-slide-up animate-delay-300">
            {categories.map((cat, idx) => (
              <button
                key={cat.value}
                onClick={() => {
                  setStyle(cat.value);
                  setTimeout(handleSearch, 100);
                }}
                className="px-3 sm:px-5 py-1.5 sm:py-2 bg-white border-2 border-gray-200 rounded-full font-medium text-xs sm:text-sm text-gray-700 hover:border-primary-600 hover:text-primary-600 hover:shadow-md transition-smooth"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {cat.name}
              </button>
            ))}
          </div>


        </div>
      </section>

      {/* Featured Braiders */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
              Featured Braiders
            </h2>
            <p className="text-lg text-gray-600">Top-rated professionals ready to serve you</p>
          </div>

          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentCarouselIndex * 100}%)`,
                }}
              >
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-2 sm:px-3">
                      <div className="bg-white rounded-2xl p-4 sm:p-6 animate-pulse">
                        <div className="w-full h-40 sm:h-48 bg-gray-200 rounded-xl mb-4" />
                        <div className="h-4 bg-gray-200 rounded mb-3" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  ))
                ) : featuredBraiders.length > 0 ? (
                  featuredBraiders.map((braider, idx) => {
                    const displayImage = braider.avatar_url || BRAIDER_FEATURED_IMAGES[idx % BRAIDER_FEATURED_IMAGES.length].src;
                    
                    return (
                      <div key={braider.email || braider.id} className="w-1/2 sm:w-1/2 lg:w-1/4 flex-shrink-0 px-2 sm:px-3">
                        <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                          <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-primary-300 to-accent-300 flex items-center justify-center relative overflow-hidden">
                            {displayImage ? (
                              <img 
                                src={displayImage} 
                                alt={braider.full_name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-3xl sm:text-4xl">💇</div>
                            )}
                            {braider.verification_status === 'unverified' && (
                              <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                                Unverified
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:p-6 flex-1 flex flex-col">
                            <h3 className="font-semibold text-base sm:text-lg mb-2 text-gray-900 line-clamp-1">{braider.full_name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{braider.bio}</p>
                            <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-gray-900">
                                  {braider.rating_avg ? braider.rating_avg.toFixed(1) : 'New'}
                                </span>
                              </div>
                              <span className="text-gray-500">({braider.rating_count || 0} review{braider.rating_count !== 1 ? 's' : ''})</span>
                            </div>
                            {braider.verification_status === 'verified' && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-4 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </div>
                            )}
                            <div className="mt-auto">
                              <Link
                                href={`/braider/${braider.user_id || braider.id}`}
                                className="block w-full text-center px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold text-xs sm:text-sm"
                              >
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">No braiders registered yet</p>
                    <Link href="/signup/braider" className="text-primary-600 font-semibold hover:text-primary-700">
                      Be the first braider →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            {featuredBraiders.length > 4 && (
              <>
                <button
                  onClick={handlePrevCarousel}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-6 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:shadow-xl transition-all hover:bg-primary-50"
                  aria-label="Previous braiders"
                >
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextCarousel}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-6 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:shadow-xl transition-all hover:bg-primary-50"
                  aria-label="Next braiders"
                >
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Carousel Dots */}
            {featuredBraiders.length > 4 && (
              <div className="flex justify-center gap-2 mt-6 sm:mt-8">
                {Array(Math.ceil(featuredBraiders.length / 4)).fill(0).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentCarouselIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentCarouselIndex ? 'bg-primary-600 w-6 sm:w-8' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to carousel page ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>



      {/* Marketplace Carousel - Prominent position before gallery */}
      <MarketplaceCarousel 
        title="Trending Accessories & Products"
        subtitle="Premium hair products, braiding supplies, and exclusive items from verified braiders"
      />

      {/* Braiding Styles Gallery */}
      <BraidingStylesGallery />

      {/* Trust Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">
              Why Choose BraidMe
            </h2>
            <p className="text-lg opacity-90">Industry-leading protection and trust</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Secure Escrow', desc: 'Funds held safely until service complete' },
              { icon: Users, title: 'Verified Pros', desc: 'ID verified and background checked' },
              { icon: Zap, title: 'SOS Safety', desc: 'Emergency alert button during service' },
              { icon: CheckCircle, title: 'Dispute Protection', desc: 'Full refund guarantee if issues arise' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="text-center animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <item.icon className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join as Braider CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-3xl p-8 sm:p-12 lg:p-16 text-center border-2 border-primary-200 animate-scale-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-6">
              Earn as a Braider
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of verified braiders earning $50-$200+ per appointment with secure payments, flexible scheduling, and full support
            </p>
            <Link 
              href="/signup/braider" 
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-smooth"
            >
              Start Earning Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="https://wa.me/15164625071" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.946 1.347l-.355.192-.368-.06c-1.286-.264-2.514-.666-3.554-1.207l-.658-.38-.67.54c-1.704 1.38-2.77 3.117-2.77 5.034 0 1.595.392 3.127 1.139 4.533l.359.687-.864.254c-1.102.325-2.074.84-2.845 1.544l-.564.504.635.368c1.905 1.105 4.105 1.714 6.514 1.714 8.094 0 14.712-6.618 14.712-14.712 0-1.93-.37-3.774-1.039-5.459l-.261-.667.56-.358c1.902-1.217 3.557-2.773 4.778-4.57l.305-.45-.523-.301c-1.997-1.15-4.285-1.783-6.683-1.783z"/>
                    </svg>
                    WhatsApp: +1 (516) 462-5071
                  </a>
                </li>
                <li>
                  <a href="mailto:Trulicares@gmail.com" className="hover:text-white transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Trulicares@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 BraidMe. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
