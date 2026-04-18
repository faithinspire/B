'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, XCircle, Loader, MessageCircle, Eye } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  braider_id: string;
  braider_name?: string;
  braider_avatar?: string;
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const storedUserId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (!storedUserId) {
      router.push('/login?redirect=/orders');
      return;
    }
    
    if (userRole !== 'customer') {
      router.push('/braider/orders');
      return;
    }
    
    setUserId(storedUserId);
  }, [router]);

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?customer_id=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
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

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-semibold mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 text-sm mt-1">Track and manage your marketplace orders</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Order #{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.payment_status)}`}>
                      {order.payment_status === 'paid' ? '✓ Paid' : order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {order.product_image ? (
                        <img src={order.product_image} alt={order.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{order.product_name || 'Product'}</h3>
                      <p className="text-sm text-gray-600">Qty: {order.quantity}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>

                    {/* Seller Info */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Seller</p>
                      <p className="text-sm font-semibold text-gray-900">{order.braider_name || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  {order.status !== 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                          const stepIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                          const isActive = idx <= stepIndex;
                          const isCurrent = idx === stepIndex;
                          
                          return (
                            <div key={step} className="flex flex-col items-center flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                              <p className={`text-xs mt-1 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                {step.charAt(0).toUpperCase() + step.slice(1)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold text-center hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    <button
                      onClick={async () => {
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
                      className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat Seller
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
