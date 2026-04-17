'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Star, MapPin, ShoppingBag, Package, Loader, AlertCircle,
  CheckCircle, X, CreditCard, Truck, Shield, ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { MarketplaceChat } from '@/app/components/MarketplaceChat';

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

const PLATFORM_FEE = 0.01; // 1%

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { user, accessToken } = useSupabaseAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderError, setOrderError] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Order form state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);

  // Resolve auth token
  useEffect(() => {
    const resolve = async () => {
      if (accessToken) { setResolvedToken(accessToken); return; }
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) setResolvedToken(session.access_token);
      }
    };
    resolve();
  }, [accessToken]);

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/products/${productId}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Product not found');
        setProduct(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleOrderNow = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setShowOrderModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      setOrderError('Please accept the Terms & Conditions to continue');
      return;
    }
    if (!shippingAddress.trim()) {
      setOrderError('Please enter your delivery address');
      return;
    }
    if (!resolvedToken) {
      setOrderError('Please log in to place an order');
      return;
    }

    setOrdering(true);
    setOrderError('');

    try {
      const res = await fetch('/api/marketplace/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resolvedToken}`,
        },
        body: JSON.stringify({
          product_id: product!.id,
          quantity,
          shipping_address: shippingAddress.trim(),
          country_code: product!.country_code || 'NG',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to place order');

      // If Paystack redirect
      if (data.data.payment?.provider === 'paystack' && data.data.payment.authorizationUrl) {
        window.location.href = data.data.payment.authorizationUrl;
        return;
      }

      // If Stripe - show success (in real app would show Stripe Elements)
      setOrderNumber(data.data.order_number);
      setOrderId(data.data.order_id);
      setOrderSuccess(true);
      setShowOrderModal(false);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

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
          <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            <ArrowLeft className="w-5 h-5" />Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const currencySymbol = product.currency === 'NGN' ? '₦' : '$';
  const platformFeeAmount = product.price * quantity * PLATFORM_FEE;
  const totalAmount = product.price * quantity;
  const sellerPayout = totalAmount - platformFeeAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      {/* Order Success Banner */}
      {orderSuccess && (
        <div className="bg-green-600 text-white py-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <p className="font-semibold">Order placed! Order #{orderNumber} — Payment on delivery.</p>
            </div>
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg font-semibold text-sm hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Seller
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && product && orderId && (
        <MarketplaceChat
          orderId={orderId}
          otherUserId={product.braider_id}
          otherUserName="Seller"
          onClose={() => setShowChat(false)}
          isModal={true}
        />
      )}

      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium text-sm sm:text-base">
          <ArrowLeft className="w-5 h-5" />Back to Marketplace
        </button>
      </div>

      {/* Product */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image */}
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] sm:min-h-[320px] bg-gradient-to-br from-purple-100 to-pink-100">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">🛍️</div>
              )}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-purple-700 shadow">
                {product.category}
              </div>
            </div>

            {/* Details */}
            <div className="p-5 sm:p-6 lg:p-8 flex flex-col">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 sm:w-5 sm:h-5 ${s <= Math.round(product.rating_avg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{(product.rating_avg || 0).toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-gray-500">({product.rating_count || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-4 sm:mb-6">
                {currencySymbol}{(product.price || 0).toLocaleString()}
              </div>

              {/* Location & Stock */}
              <div className="space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm">{product.location_city && product.location_state ? `${product.location_city}, ${product.location_state}` : 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm">{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}</span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Payment info */}
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-sm">
                <div className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
                  <Truck className="w-4 h-4" />
                  Payment on Delivery
                </div>
                <p className="text-purple-600 text-xs">Pay when your item arrives. Secure escrow protects your money.</p>
                <p className="text-purple-500 text-xs mt-1">1% platform fee applies. {currencySymbol}{(product.price * PLATFORM_FEE).toFixed(2)} fee on this item.</p>
              </div>

              {/* CTA */}
              <div className="mt-auto space-y-3">
                {product.stock_quantity > 0 && product.is_active ? (
                  <button
                    onClick={handleOrderNow}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                    Order Now — Pay on Delivery
                  </button>
                ) : (
                  <button disabled className="w-full bg-gray-300 text-gray-500 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" />Out of Stock
                  </button>
                )}
                <Link href="/marketplace" className="w-full border-2 border-purple-300 text-purple-600 py-2.5 sm:py-3 rounded-xl font-semibold text-center hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: '🚚', title: 'Pay on Delivery', desc: 'Pay when item arrives' },
            { icon: '✅', title: 'Verified Seller', desc: 'Trusted braider' },
            { icon: '🔒', title: 'Escrow Protected', desc: '1% platform fee' },
          ].map(b => (
            <div key={b.title} className="bg-white rounded-xl shadow p-3 sm:p-5 text-center">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{b.icon}</div>
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">{b.title}</h4>
              <p className="text-gray-500 text-xs mt-0.5 sm:mt-1 hidden sm:block">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Place Order</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Product Summary */}
              <div className="bg-gray-50 rounded-xl p-4 flex gap-4">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                  <p className="text-purple-600 font-bold text-lg">{currencySymbol}{product.price.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">{product.location_city}, {product.location_state}</p>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-lg font-bold hover:border-purple-400"
                  >-</button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-lg font-bold hover:border-purple-400"
                  >+</button>
                  <span className="text-sm text-gray-500">({product.stock_quantity} available)</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Delivery Address *</label>
                <textarea
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm"
                  placeholder="Enter your full delivery address..."
                />
              </div>

              {/* Order Summary */}
              <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm">Order Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="font-semibold">{currencySymbol}{(product.price * quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform fee (1%)</span>
                  <span className="text-gray-600">{currencySymbol}{platformFeeAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-purple-200 pt-2 flex justify-between font-bold">
                  <span>Total (Pay on Delivery)</span>
                  <span className="text-purple-600 text-lg">{currencySymbol}{totalAmount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">Seller receives: {currencySymbol}{sellerPayout.toFixed(2)} after 1% platform fee</p>
              </div>

              {/* Payment Method */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
                  <CreditCard className="w-4 h-4" />
                  {product.country_code === 'NG' ? 'Paystack (Nigeria)' : 'Stripe (USA)'}
                </div>
                <p className="text-blue-600 text-xs">
                  {product.country_code === 'NG'
                    ? 'Pay securely via card, bank transfer, or USSD. Money held in escrow until delivery.'
                    : 'Pay securely via credit/debit card. Money held in escrow until delivery.'}
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowTerms(!showTerms)}
                  className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <span>Terms & Conditions</span>
                  {showTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTerms && (
                  <div className="px-4 pb-4 text-xs text-gray-600 space-y-2 max-h-48 overflow-y-auto border-t border-gray-100">
                    <p className="font-semibold text-gray-800">BraidMee Marketplace Terms & Conditions</p>
                    <p><strong>1. Payment & Escrow:</strong> All payments are held in escrow by BraidMee until the buyer confirms delivery. A 1% platform fee is deducted from the seller's payout.</p>
                    <p><strong>2. Delivery:</strong> Payment is due on delivery. The buyer must confirm receipt within 48 hours. If no confirmation, funds are automatically released to the seller.</p>
                    <p><strong>3. Refunds:</strong> Refunds are available if the item is not delivered or significantly different from the description. Disputes must be raised within 48 hours of delivery.</p>
                    <p><strong>4. Seller Responsibility:</strong> Sellers are responsible for accurate product descriptions, timely delivery, and quality of goods.</p>
                    <p><strong>5. Platform Fee:</strong> BraidMee charges a 1% fee on all transactions. This fee is deducted from the seller's payout, not added to the buyer's price.</p>
                    <p><strong>6. Prohibited Items:</strong> Counterfeit goods, illegal items, or items that violate intellectual property rights are strictly prohibited.</p>
                    <p><strong>7. Dispute Resolution:</strong> BraidMee acts as a neutral mediator in disputes. Our decision is final.</p>
                    <p><strong>8. Privacy:</strong> Your personal information is protected under our Privacy Policy. Delivery addresses are shared only with the seller.</p>
                    <p><strong>9. Governing Law:</strong> These terms are governed by the laws of Nigeria and the United States, depending on your location.</p>
                    <p><strong>10. Changes:</strong> BraidMee reserves the right to modify these terms at any time with notice.</p>
                  </div>
                )}
              </div>

              {/* Accept Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the <button type="button" onClick={() => setShowTerms(true)} className="text-purple-600 underline">Terms & Conditions</button> and understand that payment is on delivery with a 1% platform fee.
                </span>
              </label>

              {/* Error */}
              {orderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{orderError}</p>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={ordering || !termsAccepted}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-base hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {ordering ? (
                  <><Loader className="w-5 h-5 animate-spin" />Processing...</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" />Confirm Order — {currencySymbol}{totalAmount.toLocaleString()}</>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                <Shield className="w-3 h-3 inline mr-1" />
                Your payment is protected by BraidMee escrow
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
