'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Star, ShoppingBag, MapPin, X, Loader } from 'lucide-react';
import { COUNTRIES, type CountryCode } from '@/lib/countries';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  rating_avg: number;
  rating_count: number;
  location_state: string;
  location_city: string;
  country_code: string;
  description: string;
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
  'Niger', 'Gombe', 'Bauchi', 'Benue', 'Gusau', 'Zaria', 'Katsina',
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || '');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('NG');
  const [selectedState, setSelectedState] = useState(searchParams?.get('state') || '');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/marketplace/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const url = new URL('/api/marketplace/products', window.location.origin);
        if (searchTerm) url.searchParams.append('search', searchTerm);
        if (selectedCategory) url.searchParams.append('category', selectedCategory);
        if (selectedCountry) url.searchParams.append('country_code', selectedCountry);
        if (selectedState) url.searchParams.append('state', selectedState);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', '12');

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm, selectedCategory, selectedCountry, selectedState, page]);

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country);
    setSelectedState('');
    setPage(1);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">BraidMee Marketplace</h1>
          <p className="text-sm sm:text-base lg:text-lg text-purple-100 mb-6 sm:mb-8">
            Discover premium hair accessories, extensions, and braiding materials from verified braiders worldwide
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm sm:text-base"
              />
            </div>
            <button className="bg-white text-purple-600 px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20 space-y-6 max-h-[calc(100vh-100px)] overflow-y-auto">
              {/* Country Selection */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Country</h3>
                <div className="space-y-2">
                  {Object.entries(COUNTRIES).map(([code, config]) => (
                    <button
                      key={code}
                      onClick={() => handleCountryChange(code as CountryCode)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        selectedCountry === code
                          ? 'bg-purple-100 text-purple-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl">{config.flag}</span>
                      <div>
                        <div className="font-semibold text-sm">{config.name}</div>
                        <div className="text-xs text-gray-600">{config.currency}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                      !selectedCategory
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                        selectedCategory === cat.id
                          ? 'bg-purple-100 text-purple-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.icon_emoji}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="">All Locations</option>
                  {(selectedCountry === 'NG' ? NIGERIAN_STATES : USA_STATES).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setShowMobileFilters(false)} />
          )}

          <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transform transition-transform lg:hidden ${
            showMobileFilters ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-6 space-y-6 overflow-y-auto h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Country Selection */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Country</h3>
                <div className="space-y-2">
                  {Object.entries(COUNTRIES).map(([code, config]) => (
                    <button
                      key={code}
                      onClick={() => {
                        handleCountryChange(code as CountryCode);
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                        selectedCountry === code
                          ? 'bg-purple-100 text-purple-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{config.flag}</span>
                      {config.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleCategoryChange('');
                      setShowMobileFilters(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                      !selectedCategory
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleCategoryChange(cat.id);
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                        selectedCategory === cat.id
                          ? 'bg-purple-100 text-purple-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.icon_emoji}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Location</h3>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    handleStateChange(e.target.value);
                    setShowMobileFilters(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="">All Locations</option>
                  {(selectedCountry === 'NG' ? NIGERIAN_STATES : USA_STATES).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg animate-pulse h-80 sm:h-96"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <ShoppingBag className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-base sm:text-lg">No products found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/marketplace/product/${product.id}`}
                      className="group"
                    >
                      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:scale-105 hover:-translate-y-2">
                        {/* Image */}
                        <div className="relative h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">
                              🛍️
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {product.name}
                          </h3>

                          {/* Location */}
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 mb-3">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {product.location_city && product.location_state
                                ? `${product.location_city}, ${product.location_state}`
                                : 'Location not specified'}
                            </span>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold text-gray-900">
                                {product.rating_avg.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">({product.rating_count})</span>
                          </div>

                          {/* Price */}
                          <div className="mt-auto">
                            {product.price ? (
                              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-4">
                                {product.currency === 'NGN' ? '₦' : '$'}{product.price.toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-base sm:text-lg text-gray-600 mb-4">Contact for price</div>
                            )}

                            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:from-purple-700 group-hover:to-pink-700 text-sm sm:text-base">
                              <ShoppingBag className="w-4 sm:w-5 h-4 sm:h-5" />
                              Order Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base"
                  >
                    Previous
                  </button>
                  <span className="px-3 sm:px-4 py-2 text-sm sm:text-base">Page {page}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={products.length < 12}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
