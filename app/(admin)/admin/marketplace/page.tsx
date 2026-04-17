'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, AlertCircle, CheckCircle, Package, MapPin, Clock, DollarSign, Loader, X } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  braider_id: string;
  total_amount: number;
  currency: string;
  status: string;
  shipping_address: string;
  notes: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  braider_name?: string;
  braider_email?: string;
  product_name?: string;
  product_image?: string;
  quantity?: number;
}

export default function AdminMarketplacePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/marketplace/orders');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load orders');
      setOrders(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleReleasePayout = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/admin/marketplace/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: 'paid_out' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to release payment');
      setSuccessMsg('Payment released to braider!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release payment');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'paid_out': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    paid_out: orders.filter(o => o.status === 'paid_out').length,
    revenue: orders.filter(o => ['delivered', 'paid_out'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_amount * 0.01), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketplace Orders</h1>
            <p className="text-gray-600 text-sm mt-1">Monitor all marketplace orders and release payments</p>
          </div>
          <button onClick={fetchOrders} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Orders', value: stats.total, color: 'text-gray-900' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Delivered', value: stats.delivered, color: 'text-green-600' },
            { label: 'Paid Out', value: stats.paid_out, color: 'text-purple-600' },
            { label: 'Platform Revenue (1%)', value: `₦${stats.revenue.toFixed(0)}`, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError('')}><X className="w-4 h-4 text-red-500" /></button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['all', 'pending', 'confirmed', 'delivered', 'paid_out', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'paid_out' ? 'Paid Out' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No {filter !== 'all' ? filter : ''} orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-16 h-24 sm:h-16 rounded-xl overflow-hidden bg-purple-100 flex-shrink-0">
                      {order.product_image ? (
                        <img src={order.product_image} alt={order.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-bold text-gray-900">{order.product_name}</p>
                          <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status === 'paid_out' ? 'Paid Out' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-500" />
                          <span>Qty: {order.quantity} • {order.currency === 'USD' ? '$' : '₦'}{order.total_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500">Customer:</span>
                          <span>{order.customer_name} ({order.customer_email})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500">Seller:</span>
                          <span>{order.braider_name} ({order.braider_email})</span>
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{order.shipping_address}</span>
                        </div>
                      </div>

                      {/* Platform fee info */}
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg text-xs text-purple-700">
                        Platform fee (1%): {order.currency === 'USD' ? '$' : '₦'}{(order.total_amount * 0.01).toFixed(2)} •
                        Seller payout: {order.currency === 'USD' ? '$' : '₦'}{(order.total_amount * 0.99).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {order.status === 'delivered' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleReleasePayout(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
                      >
                        {actionLoading === order.id ? <Loader className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                        Release Payment to Seller
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
