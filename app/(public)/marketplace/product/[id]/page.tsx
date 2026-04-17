'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, MapPin, ShoppingBag, Package, Loader, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  image_url: string | null;
  rating_avg: number;
  rating_count: number;
  location_state: string;
  location_city: string;
  country_code: string;
  stock_quantity: number;
  is_active: boolean;
  braider_id: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/products/${productId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Product not found');
        }

        setProduct(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This product does not exist or has been removed.'}</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const currencySymbol = product.currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>
      </div>

      {/* Product Detail */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[320px] bg-gradient-to-br from-purple-100 to-pink-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🛍️
                </div>
              )}
              {/* Category Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-purple-700 shadow">
                {product.category}
              </div>
            </div>

            {/* Details */}
            <div className="p-6 sm:p-8 flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(product.rating_avg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{(product.rating_avg || 0).toFixed(1)}</span>
                <span className="text-sm text-gray-500">({product.rating_count || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-6">
                {currencySymbol}{(product.price || 0).toLocaleString()}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm">
                  {product.location_city && product.location_state
                    ? `${product.location_city}, ${product.location_state}`
                    : 'Location not specified'}
                </span>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <Package className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm">
                  {product.stock_quantity > 0
                    ? `${product.stock_quantity} in stock`
                    : 'Out of stock'}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto space-y-3">
                {product.stock_quantity > 0 && product.is_active ? (
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3">
                    <ShoppingBag className="w-6 h-6" />
                    Order Now
                  </button>
                ) : (
                  <button disabled className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-3">
                    <ShoppingBag className="w-6 h-6" />
                    Out of Stock
                  </button>
                )}

                <Link
                  href="/marketplace"
                  className="w-full border-2 border-purple-300 text-purple-600 py-3 rounded-xl font-semibold text-center hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-2xl mb-2">🚚</div>
            <h4 className="font-semibold text-gray-900 text-sm">Fast Delivery</h4>
            <p className="text-gray-500 text-xs mt-1">Delivered to your location</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-2xl mb-2">✅</div>
            <h4 className="font-semibold text-gray-900 text-sm">Verified Seller</h4>
            <p className="text-gray-500 text-xs mt-1">Trusted braider on BraidMee</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="font-semibold text-gray-900 text-sm">Secure Payment</h4>
            <p className="text-gray-500 text-xs mt-1">Protected by escrow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
