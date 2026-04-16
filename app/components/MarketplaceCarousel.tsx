'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  images: string[];
  rating_avg: number;
  rating_count: number;
  braider_id: string;
}

interface MarketplaceCarouselProps {
  title: string;
  subtitle?: string;
  category?: string;
}

export default function MarketplaceCarousel({ title, subtitle, category }: MarketplaceCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = new URL('/api/marketplace/products', window.location.origin);
        if (category) url.searchParams.append('category', category);
        url.searchParams.append('limit', '12');

        const response = await fetch(url);
        const data = await response.json();
        setProducts(data.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
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

  if (products.length === 0) {
    return null;
  }

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
            style={{ scrollBehavior: 'smooth' }}
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/product/${product.id}`}
                className="flex-shrink-0 w-72 group/card"
              >
                {/* Product Card */}
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:scale-105 hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        🛍️
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Featured
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover/card:text-purple-600 transition-colors">
                      {product.name}
                    </h3>

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
                        <div className="text-2xl font-bold text-purple-600 mb-4">
                          ₦{product.price.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-lg text-gray-600 mb-4">Contact for price</div>
                      )}

                      {/* CTA Button */}
                      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover/card:from-purple-700 group-hover/card:to-pink-700">
                        <ShoppingBag className="w-5 h-5" />
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
