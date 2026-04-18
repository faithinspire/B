'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, XCircle, Loader, MessageCircle, MapPin, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  total_amount: number;
  platform_fee: number;
  seller_payout: number;
  shipping_address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  braider_id: string;
  braider_name?: string;
  braider_avatar?: string;
  customer_name?: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?id=${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This order could not be found.'}</p>
          <Link
            href="/orders"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/orders" className="text-purple-600 hover:text-purple-700 text-sm font-semibold mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 ${getStatusColor(order.status)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(order.status)}
            <div>
              <p className="font-semibold">
                {order.status === 'pending' && 'Order Placed'}
                {order.status === 'processing' && 'Processing'}
                {order.status === 'shipped' && 'On the Way'}
                {order.status === 'delivered' && 'Delivered'}
                {order.status === 'cancelled' && 'Cancelled'}
              </p>
              <p className="text-sm opacity-80">
                {order.status === 'pending' && 'Your order is being prepared'}
                {order.status === 'processing' && 'Your order is being processed'}
                {order.status === 'shipped' && 'Your order is on its way'}
                {order.status === 'delivered' && 'Your order has been delivered'}
                {order.status === 'cancelled' && 'This order was cancelled'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Progress</h2>
            <div className="flex items-start justify-between">
              {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                const stepIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                const isActive = idx <= stepIndex;
                const isCurrent = idx === stepIndex;
                
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    {/* Connector Line */}
                    {idx < 3 && (
                      <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                        idx < stepIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                    
                    {/* Step Circle */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive 
                        ? isCurrent 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {idx < stepIndex ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        getStatusIcon(step)
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Product</h2>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {order.product_image ? (
                  <img src={order.product_image} alt={order.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{order.product_name}</h3>
                <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                <p className="text-lg font-bold text-gray-900 mt-2">${order.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Seller</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                {order.braider_avatar ? (
                  <img src={order.braider_avatar} alt={order.braider_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">💇</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.braider_name || 'Unknown Seller'}</p>
                <button
                  onClick={async () => {
                    const userId = localStorage.getItem('userId');
                    if (!userId) {
                      router.push('/login');
                      return;
                    }
                    try {
                      const res = await fetch('/api/chat/create-conversation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customer_id: userId,
                          braider_id: order.braider_id,
                          initial_message: `Hi! I have a question about my order #${order.order_number}.`,
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.conversation) {
                        router.push(`/messages?conversation=${data.conversation.id}`);
                      }
                    } catch (err) {
                      console.error('Failed to start chat:', err);
                    }
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with Seller
                </button>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h2>
            <p className="text-gray-600">{order.shipping_address || 'Not provided'}</p>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${
                  order.payment_status === 'paid' ? 'text-green-600' : 
                  order.payment_status === 'refunded' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">${order.total_amount.toFixed(2)}</span>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="text-sm text-gray-500">{order.payment_reference}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Order Placed</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {order.status !== 'pending' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Processing Started</p>
                  <p className="text-sm text-gray-500">Your order is being prepared</p>
                </div>
              </div>
            )}
            {order.status === 'shipped' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Shipped</p>
                  <p className="text-sm text-gray-500">Your order is on its way</p>
                </div>
              </div>
            )}
            {order.status === 'delivered' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Delivered</p>
                  <p className="text-sm text-gray-500">Your order has been delivered</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
