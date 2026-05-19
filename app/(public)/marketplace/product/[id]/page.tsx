'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, MapPin, Star, Loader, AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
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
  stock_quantity: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabaseAuthStore();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/products?product_id=${productId}`);
        const json = await res.json();

        if (!res.ok || !json.data || json.data.length === 0) {
          setError('Product not found');
          return;
        }

        setProduct(json.data[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  const handleOrderNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!product) return;

    setOrderLoading(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          shipping_address: 'To be confirmed',
          country_code: product.country_code,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to create order');
        setOrderLoading(false);
        return;
      }

      if (!json.data || !json.data.order_id) {
        setError('Order created but no order ID returned');
        setOrderLoading(false);
        return;
      }

      setOrderSuccess(true);
      // Use window.location.href to force a hard navigation and prevent any redirect loops
      // This ensures we completely leave the product page
      setTimeout(() => {
        window.location.href = `/marketplace/order-confirmation/${json.data.order_id}`;
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-white">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-900 mb-2">Product Not Found</h2>
              <p className="text-red-700">{error || 'This product is no longer available'}</p>
              <Link
                href="/marketplace"
                className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Return to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getCurrencySymbol = (): string => {
    if (product.country_code === 'NG' || product.currency === 'NGN') return '\u20A6';
    if (product.country_code === 'US' || product.currency === 'USD') return '$';
    return '\u20A6';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-6xl">🛍️</div>
              )}
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">
                  {product.country_code === 'US' ? '🇺🇸 USA' : '🇳🇬 Nigeria'}
                </span>
                {product.stock_quantity > 0 ? (
                  <span className="text-sm font-semibold text-green-600">In Stock</span>
                ) : (
                  <span className="text-sm font-semibold text-red-600">Out of Stock</span>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-5 h-5" />
                <span>
                  {product.location_city && product.location_state
                    ? `${product.location_city}, ${product.location_state}`
                    : 'Location not specified'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">{(product.rating_avg || 0).toFixed(1)}</span>
                </div>
                <span className="text-gray-500">({product.rating_count || 0} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <p className="text-gray-600 text-sm mb-2">Price</p>
              <p className="text-4xl font-bold text-purple-600">
                {getCurrencySymbol()}{(product.price || 0).toLocaleString()}
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Category */}
            <div>
              <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                {product.category}
              </span>
            </div>

            {/* Quantity & Order */}
            {product.stock_quantity > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border border-gray-300 rounded-lg py-2"
                      min="1"
                      max={product.stock_quantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {orderSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 font-semibold">✓ Order created successfully! Redirecting...</p>
                  </div>
                )}

                <button
                  onClick={handleOrderNow}
                  disabled={orderLoading || orderSuccess}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {orderLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : orderSuccess ? (
                    '✓ Order Confirmed'
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Order Now
                    </>
                  )}
                </button>

                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    try {
                      const res = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customer_id: user.id,
                          braider_id: product.braider_id,
                          booking_id: null,
                        }),
                      });
                      if (res.ok) {
                        const conv = await res.json();
                        if (conv.id) {
                          router.push(`/messages/conv/${conv.id}`);
                          return;
                        }
                      }
                    } catch (err) {
                      console.error('Chat error:', err);
                    }
                    router.push(`/messages?braider_id=${product.braider_id}`);
                  }}
                  className="w-full border-2 border-purple-300 text-purple-600 py-3 rounded-lg font-bold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with Seller
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
