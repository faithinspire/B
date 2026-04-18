'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { 
  Search, Package, Truck, CheckCircle, XCircle, Clock, 
  AlertCircle, Loader, Filter, Download, Eye, MessageCircle 
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  braider_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  platform_fee: number;
  seller_payout: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  shipping_address: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  braider_name?: string;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.braider_name || '').toLowerCase().includes(q) ||
        (o.product_name || '').toLowerCase().includes(q)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    
    if (paymentFilter !== 'all') {
      result = result.filter(o => o.payment_status === paymentFilter);
    }
    
    setFiltered(result);
  }, [search, statusFilter, paymentFilter, orders]);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/orders');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
      setStats(data.stats || {
        total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus as any } : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Orders Management</h1>
          <p className="text-gray-600 text-sm">Track and manage all marketplace orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Processing', value: stats.processing, color: 'text-blue-600' },
            { label: 'Shipped', value: stats.shipped, color: 'text-purple-600' },
            { label: 'Delivered', value: stats.delivered, color: 'text-green-600' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold text-sm">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, customer, braider..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No orders found</p>
              <p className="text-gray-500 text-sm mt-1">
                {statusFilter !== 'all' ? `No ${statusFilter} orders` : 'No orders yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{order.product_name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.customer_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.braider_name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">${order.total_amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Fee: ${order.platform_fee.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.payment_status)}`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'processing')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                              Process
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="text-purple-600 hover:text-purple-800 text-sm font-semibold"
                            >
                              Ship
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Order {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-white/80 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentColor(selectedOrder.payment_status)}`}>
                  {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Customer</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedOrder.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Seller</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedOrder.braider_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Product</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedOrder.product_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Quantity</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">${selectedOrder.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Seller Payout</p>
                  <p className="text-sm text-gray-900 mt-1">${selectedOrder.seller_payout.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Shipping Address</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedOrder.shipping_address || 'Not provided'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'processing'); }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                  >
                    Mark as Processing
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'shipped'); }}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
                  >
                    Mark as Shipped
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'delivered'); }}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                  >
                    Mark as Delivered
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'cancelled'); setSelectedOrder(null); }}
                    className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
