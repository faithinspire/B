'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { DollarSign, Search, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  braider_name?: string;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    if (!user) return;

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
  }, [user]);

  // Initialize
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'admin') {
      return;
    }

    fetchPayments();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchPayments]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
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
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-600">Track all transactions and revenue</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'pending', 'completed', 'failed', 'refunded'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg font-semibold transition-colors capitalize whitespace-nowrap text-sm md:text-base ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchPayments}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-600">${completedAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Transactions</p>
            <p className="text-3xl font-bold text-gray-900">{filteredPayments.length}</p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            <p className="text-gray-600 font-semibold">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No payments found</p>
            <p className="text-gray-500 mt-2">
              {searchQuery ? 'No payments match your search' : 'No payments yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Booking</th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Customer</th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Braider</th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Method</th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-mono text-gray-900">{payment.booking_id.substring(0, 8)}</td>
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 hidden sm:table-cell">{payment.customer_name || 'Unknown'}</td>
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 hidden md:table-cell">{payment.braider_name || 'Unknown'}</td>
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-semibold text-gray-900">${payment.amount.toFixed(2)}</td>
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-600 capitalize hidden lg:table-cell">{payment.payment_method}</td>
                      <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-600 hidden lg:table-cell">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
