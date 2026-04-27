'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  rating_avg: number;
  rating_count: number;
  braider_id: string;
  country_code: string;
  category?: string;
}

interface MarketplaceCarouselProps {
  title: string;
  subtitle?: string;
  category?: string;
}

// Demo products with product-themed placeholders (no braiding style images)
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Premium Hair Extensions',
    price: 15000,
    currency: 'NGN',
    image_url: null,
    rating_avg: 4.8,
    rating_count: 124,
    braider_id: 'demo',
    country_code: 'NG',
  },
  {
    id: 'demo-2',
    name: 'Braiding Beads Set',
    price: 5000,
    currency: 'NGN',
    image_url: null,
    rating_avg: 4.9,
    rating_count: 89,
    braider_id: 'demo',
    country_code: 'NG',
  },
  {
    id: 'demo-3',
    name: 'Wig Installation Kit',
    price: 25000,
    currency: 'NGN',
    image_url: null,
    rating_avg: 4.7,
    rating_count: 156,
    braider_id: 'demo',
    country_code: 'NG',
  },
  {
    id: 'demo-4',
    name: 'Braiding Thread Bundle',
    price: 8000,
    currency: 'NGN',
    image_url: null,
    rating_avg: 4.6,
    rating_count: 203,
    braider_id: 'demo',
    country_code: 'NG',
  },
  {
    id: 'demo-5',
    name: 'Hair Care Oil Set',
    price: 45,
    currency: 'USD',
    image_url: null,
    rating_avg: 4.9,
    rating_count: 67,
    braider_id: 'demo',
    country_code: 'US',
  },
  {
    id: 'demo-6',
    name: 'Knotless Braid Kit',
    price: 35,
    currency: 'USD',
    image_url: null,
    rating_avg: 4.7,
    rating_count: 91,
    braider_id: 'demo',
    country_code: 'US',
  },
];

export default function MarketplaceCarousel({ title, subtitle, category }: MarketplaceCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch all products without country filter to get everything
        const timestamp = Date.now();
        const res = await fetch(`/api/marketplace/products?limit=12&page=1&t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch products:', res.status);
          setProducts([]);
          setLoading(false);
          return;
        }

        const json = await res.json();
        const products = json.data || [];
        
        // Filter by category if provided
        let filtered = products;
        if (category) {
          filtered = products.filter((p: Product) => 
            p.category?.toLowerCase() === category.toLowerCase()
          );
        }

        setProducts(filtered);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${title}`);
    if (!container) return;

    const scrollAmount = 400;
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  if (loading) {
    return (
      <div className="py-12 px-4 md:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Use real products if available, otherwise show demo products
  const displayProducts = products.length > 0 ? products : DEMO_PRODUCTS;

  return (
    <section className="py-12 px-4 md:px-8 bg-gradient-to-br from-white via-purple-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
          <Link
            href="/marketplace"
            className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
          >
            View All
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative group">
          {/* Scroll Container */}
          <div
            id={`carousel-${title}`}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayProducts.map((product) => (
              <Link
                key={product.id}
                href={product.id.startsWith('demo') ? '/marketplace' : `/marketplace/product/${product.id}`}
                className="flex-shrink-0 w-64 sm:w-72 group/card snap-start"
              >
                {/* Product Card */}
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:scale-105 hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full items-center justify-center flex-col gap-2 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200"
                      style={{ display: product.image_url ? 'none' : 'flex' }}
                    >
                      <span className="text-5xl">🛍️</span>
                      <span className="text-xs font-semibold text-purple-600 text-center px-2">{product.name}</span>
                    </div>
                    {/* Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                      {product.country_code === 'US' ? '🇺🇸 USA' : '🇳🇬 NG'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover/card:text-purple-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {(product.rating_avg || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">({product.rating_count || 0})</span>
                    </div>

                    {/* Price */}
                    <div className="mt-auto">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-3 sm:mb-4">
                        {product.currency === 'USD' ? '$' : '₦'}{(product.price || 0).toLocaleString()}
                      </div>

                      {/* CTA Button */}
                      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover/card:from-purple-700 group-hover/card:to-pink-700 text-sm sm:text-base">
                        <ShoppingBag className="w-4 sm:w-5 h-4 sm:h-5" />
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft className="w-6 h-6 text-purple-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight className="w-6 h-6 text-purple-600" />
          </button>
        </div>
      </div>
    </section>
  );
}
