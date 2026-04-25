'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Star, ShoppingBag, MapPin, X, Loader, AlertCircle, Crown, MessageCircle } from 'lucide-react';
import { COUNTRIES, type CountryCode } from '@/lib/countries';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  rating_avg: number;
  rating_count: number;
  location_state: string;
  location_city: string;
  country_code: string;
  description: string;
  category: string;
  braider_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_emoji: string;
}

const NIGERIAN_STATES = [
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Enugu', 'Benin City',
  'Katsina', 'Kaduna', 'Kogi', 'Kwara', 'Oyo', 'Osun', 'Ondo', 'Ekiti',
  'Delta', 'Rivers', 'Bayelsa', 'Cross River', 'Akwa Ibom', 'Calabar',
  'Abia', 'Imo', 'Ebonyi', 'Anambra', 'Nasarawa', 'Plateau', 'Taraba',
  'Adamawa', 'Yobe', 'Borno', 'Jigawa', 'Kebbi', 'Sokoto', 'Zamfara',
  'Niger', 'Gombe', 'Bauchi', 'Benue', 'Gusau', 'Zaria',
];

const USA_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia',
];

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSupabaseAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || '');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | ''>('');
  const [selectedState, setSelectedState] = useState(searchParams?.get('state') || '');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetch('/api/marketplace/categories')
      .then(r => r.json())
      .then(d => { if (d.data) setCategories(d.data); })
      .catch(err => console.error('Categories error:', err));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedCountry) params.set('country_code', selectedCountry);
        if (selectedState) params.set('state', selectedState);
        params.set('page', String(page));
        params.set('limit', '20');

        const res = await fetch(`/api/marketplace/products?${params.toString()}`);
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json.error || `Server error ${res.status}`);
        }

        setProducts(json.data || []);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load products';
          setError(msg);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [searchTerm, selectedCategory, selectedCountry, selectedState, page]);

  const isOwnProduct = (product: Product) => {
    return user?.role === 'braider' && user?.id === product.braider_id;
  };

  const getCurrencySymbol = (product: Product) => {
    if (product.country_code === 'NG' || product.currency === 'NGN') return '₦';
    if (product.country_code === 'US' || product.currency === 'USD') return '$';
    return '₦'; // Default to Naira
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">Country</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setSelectedCountry(''); setSelectedState(''); setPage(1); setShowMobileFilters(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 text-sm ${
              !selectedCountry ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">🌍</span>
            <div>
              <div className="font-semibold">All Countries</div>
              <div className="text-xs text-gray-500">Show all products</div>
            </div>
          </button>
          {Object.entries(COUNTRIES).map(([code, config]) => (
            <button
              key={code}
              onClick={() => { setSelectedCountry(code as CountryCode); setSelectedState(''); setPage(1); setShowMobileFilters(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 text-sm ${
                selectedCountry === code ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{config.flag}</span>
              <div>
                <div className="font-semibold">{config.name}</div>
                <div className="text-xs text-gray-500">{config.currency}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1); setShowMobileFilters(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
              !selectedCategory ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); setPage(1); setShowMobileFilters(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                selectedCategory === cat.name ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{cat.icon_emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCountry && (
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-3">Location</h3>
          <select
            value={selectedState}
            onChange={e => { setSelectedState(e.target.value); setPage(1); setShowMobileFilters(false); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="">All Locations</option>
            {(selectedCountry === 'NG' ? NIGERIAN_STATES : USA_STATES).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">BraidMee Marketplace</h1>
          <p className="text-sm sm:text-base text-purple-100 mb-6">
            Discover premium hair accessories, extensions, and braiding materials from Nigeria 🇳🇬 and USA 🇺🇸
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden bg-white text-purple-600 px-4 py-3 rounded-lg font-semibold hover:bg-purple-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
              <FilterPanel />
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            {/* Braider/Barber notice */}
            {user?.role === 'braider' && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                <p className="text-purple-700 text-sm font-semibold">Braider/Barber: Your products are highlighted with a purple border</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Failed to load products</p>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button onClick={() => { setError(''); setPage(1); }} className="mt-2 text-sm text-red-600 underline">
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg animate-pulse h-80" />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-semibold">No products found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term</p>
                {(selectedCategory || selectedState || searchTerm || selectedCountry) && (
                  <button
                    onClick={() => { setSelectedCategory(''); setSelectedState(''); setSearchTerm(''); setSelectedCountry(''); setPage(1); }}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-4">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  {products.map(product => {
                    const isOwn = isOwnProduct(product);
                    return (
                      <Link key={product.id} href={`/marketplace/product/${product.id}`} className="group">
                        <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:-translate-y-1 ${
                          isOwn ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                        }`}>
                          {/* Image */}
                          <div className="relative h-48 sm:h-56 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">🛍️</div>
                            )}
                            {/* Country badge */}
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold text-gray-700 shadow">
                              {product.country_code === 'US' ? '🇺🇸' : '🇳🇬'}
                            </div>
                            {/* Own product badge */}
                            {isOwn && (
                              <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                Your Product
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                              {product.name}
                            </h3>

                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-3">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {product.location_city && product.location_state
                                  ? `${product.location_city}, ${product.location_state}`
                                  : 'Location not specified'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{(product.rating_avg || 0).toFixed(1)}</span>
                              <span className="text-xs text-gray-400">({product.rating_count || 0})</span>
                            </div>

                            <div className="mt-auto">
                              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-3">
                                {getCurrencySymbol(product)}{(product.price || 0).toLocaleString()}
                              </div>
                              {isOwn ? (
                                <Link
                                  href={`/braider/marketplace/edit/${product.id}`}
                                  onClick={e => e.stopPropagation()}
                                  className="w-full bg-purple-100 text-purple-700 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-200 transition-all text-sm sm:text-base flex items-center justify-center gap-2 border-2 border-purple-300"
                                >
                                  ✏️ Edit Your Product
                                </Link>
                              ) : (
                                <div className="space-y-2">
                                  <Link
                                    href={`/marketplace/product/${product.id}`}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                                  >
                                    <ShoppingBag className="w-4 h-4" />
                                    Order Now
                                  </Link>
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (!user) {
                                        router.push('/login');
                                        return;
                                      }
                                      try {
                                        const res = await fetch('/api/chat/create-conversation', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            customer_id: user.id,
                                            braider_id: product.braider_id,
                                            initial_message: `Hi! I'm interested in your product: ${product.name}`,
                                          }),
                                        });
                                        const data = await res.json();
                                        if (data.success && data.conversation) {
                                          router.push('/messages');
                                        } else {
                                          router.push('/messages');
                                        }
                                      } catch (err) {
                                        console.error('Chat error:', err);
                                        router.push('/messages');
                                      }
                                    }}
                                    className="w-full border-2 border-purple-300 text-purple-600 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Chat with Seller
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={products.length < 20}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
