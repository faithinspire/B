'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CheckCircle, XCircle, MessageCircle, Loader, AlertCircle, Package, MapPin, Clock } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  product_id: string;
  braider_id: string;
  quantity: number;
  total_amount: number;
  platform_fee: number;
  seller_payout: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  customer_name?: string;
  customer_email?: string;
  product_name?: string;
  product_image?: string;
}

export default function BraiderOrdersPage() {
  const router = useRouter();
  const { user, accessToken } = useSupabaseAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      // Use admin orders API which uses service role key (bypasses RLS)
      const res = await fetch(`/api/admin/orders?braider_id=${user.id}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load orders');
      }
      const data = await res.json();
      // Filter to only this braider's orders
      const allOrders = (data.orders || []).filter((o: Order) => o.braider_id === user.id);
      setOrders(allOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId: string, action: 'accept' | 'reject' | 'deliver') => {
    setActionLoading(orderId);
    setError('');

    try {
      const newStatus = action === 'accept' ? 'confirmed' : action === 'reject' ? 'cancelled' : 'delivered';
      
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${action} order`);
      }

      setSuccessMsg(`Order ${action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'marked as delivered'} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} order`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 text-sm mt-1">Manage orders from your marketplace products</p>
          </div>
          <Link
            href="/braider/marketplace"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
          >
            My Products
          </Link>
        </div>

        {/* Success */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No {filter !== 'all' ? filter : ''} orders yet</p>
            <p className="text-gray-500 text-sm mt-1">Orders from your products will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-xl overflow-hidden bg-purple-100 flex-shrink-0">
                      {order.product_image ? (
                        <img src={order.product_image} alt={order.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-bold text-gray-900">{order.product_name}</p>
                          <p className="text-sm text-gray-500">Order #{order.order_number || order.id.slice(0, 8)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-500" />
                          <span>Qty: {order.quantity} • ${order.total_amount?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        {order.shipping_address && (
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span className="truncate">{order.shipping_address}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-semibold text-gray-700">Customer: </span>
                        <span className="text-gray-600">{order.customer_name} {order.customer_email && `(${order.customer_email})`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(order.id, 'accept')}
                          disabled={actionLoading === order.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
                        >
                          {actionLoading === order.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleAction(order.id, 'reject')}
                          disabled={actionLoading === order.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-semibold"
                        >
                          {actionLoading === order.id ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <>
                        <Link
                          href={`/braider/marketplace/orders/${order.id}/chat`}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat with Buyer
                        </Link>
                        <button
                          onClick={() => handleAction(order.id, 'deliver')}
                          disabled={actionLoading === order.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
                        >
                          <Package className="w-4 h-4" />
                          Mark Delivered
                        </button>
                      </>
                    )}
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
