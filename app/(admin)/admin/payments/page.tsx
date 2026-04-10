'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Search, AlertCircle, CheckCircle, Clock, XCircle, Loader, X } from 'lucide-react';

interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'released';
  payment_method: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  braider_name?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded' | 'released'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [releasing, setReleasing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/payments/list', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const handleReleasePayment = async (payment: Payment) => {
    if (!confirm(`Release $${payment.amount.toFixed(2)} to ${payment.braider_name}?`)) return;

    try {
      setReleasing(true);
      const res = await fetch(`/api/admin/payments/${payment.id}/release`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to release payment');
      
      setPayments(payments.map(p =>
        p.id === payment.id ? { ...p, status: 'released' } : p
      ));
      setSelectedPayment(null);
      alert('✅ Payment released successfully');
    } catch (err) {
      console.error('Error releasing payment:', err);
      alert('❌ Failed to release payment');
    } finally {
      setReleasing(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      (payment.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.braider_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.booking_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedAmount = filteredPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'released':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'refunded':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'released':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments & Escrow</h1>
        <p className="text-gray-600 mt-1">Manage transactions and release payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total Amount</p>
          <p className="text-3xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-semibold mb-2">Completed</p>
          <p className="text-3xl font-bold text-green-600">${completedAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-semibold mb-2">Pending Release</p>
          <p className="text-3xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="released">Released</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No payments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Booking ID</p>
                  <p className="text-sm font-mono text-gray-900">{payment.booking_id.substring(0, 12)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(payment.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Customer</p>
                  <p className="text-sm text-gray-900">{payment.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Braider</p>
                  <p className="text-sm text-gray-900">{payment.braider_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="text-lg font-bold text-gray-900">${payment.amount.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Method</p>
                    <p className="text-gray-900 capitalize">{payment.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="text-gray-900">{new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setSelectedPayment(payment)}
                className="w-full px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-semibold text-sm"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Booking ID</p>
                  <p className="text-gray-900 font-mono">{selectedPayment.booking_id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedPayment.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Customer</p>
                  <p className="text-gray-900">{selectedPayment.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Braider</p>
                  <p className="text-gray-900">{selectedPayment.braider_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Payment Method</p>
                  <p className="text-gray-900 capitalize">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Created</p>
                  <p className="text-gray-900">{new Date(selectedPayment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Updated</p>
                  <p className="text-gray-900">{new Date(selectedPayment.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedPayment.status === 'completed' && (
                <button
                  onClick={() => handleReleasePayment(selectedPayment)}
                  disabled={releasing}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {releasing && <Loader className="w-4 h-4 animate-spin" />}
                  <DollarSign className="w-4 h-4" />
                  Release Payment to Braider
                </button>
              )}

              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
