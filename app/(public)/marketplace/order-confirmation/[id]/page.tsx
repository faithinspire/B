'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  delivery_address: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/marketplace/orders?order_id=${orderId}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to load order');
          setLoading(false);
          return;
        }

        if (!json.data) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        setOrder(json.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-white">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-900 mb-2">Order Not Found</h2>
              <p className="text-red-700 mb-4">{error || 'This order could not be found'}</p>
              <Link
                href="/marketplace"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
    if (order.currency === 'NGN') return '\u20A6';
    if (order.currency === 'USD') return '$';
    return '\u20A6';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse" />
              <CheckCircle className="w-20 h-20 text-green-600 relative" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been successfully created. The seller will contact you soon with delivery details.
          </p>

          {/* Order Details */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-left mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono font-semibold text-gray-900">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                <span className="text-gray-600">Product</span>
                <span className="font-semibold text-gray-900">{order.product_name}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                <span className="text-gray-600">Quantity</span>
                <span className="font-semibold text-gray-900">{order.quantity}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-purple-600">
                  {getCurrencySymbol()}{(order.total_amount || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                <span className="text-gray-600">Status</span>
                <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {order.status === 'pending' ? 'Pending' : order.status}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-gray-600">Delivery Address</span>
                <span className="text-right font-semibold text-gray-900 max-w-xs">
                  {order.delivery_address || 'To be confirmed'}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-left mb-8">
            <h3 className="font-bold text-blue-900 mb-3">What Happens Next?</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>The seller will review your order and contact you with delivery details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>You can track your order status in your account dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Payment will be processed once the order is confirmed</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/marketplace"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Continue Shopping
            </Link>
            <Link
              href="/customer/dashboard"
              className="flex-1 border-2 border-purple-300 text-purple-600 py-3 rounded-lg font-bold hover:bg-purple-50 transition-all"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
