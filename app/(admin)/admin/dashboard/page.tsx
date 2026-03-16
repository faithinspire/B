'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import {
  BarChart3,
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalBraiders: number;
  totalCustomers: number;
  totalConversations: number;
  activeConversations: number;
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'admin') {
      return;
    }

    fetchStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchStats]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24" style={{ paddingTop: 0, marginTop: 0 }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4" style={{ paddingTop: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Monitor platform activity and metrics</p>
          </div>
          <button
            onClick={fetchStats}
            className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-primary-600" />
          </button>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            <p className="text-gray-600 font-semibold">Loading dashboard...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {/* Total Users */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Total Users</h3>
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                  {stats.totalBraiders} braiders, {stats.totalCustomers} customers
                </p>
              </div>

              {/* Total Conversations */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Conversations</h3>
                  <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-accent-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
                <p className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-2">
                  {stats.activeConversations} active
                </p>
              </div>

              {/* Total Bookings */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Bookings</h3>
                  <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">All time</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Revenue</h3>
                  <DollarSign className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                  {stats.pendingPayments} pending
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <button
                onClick={() => router.push('/admin/conversations')}
                className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow text-left group"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base text-gray-900 font-semibold group-hover:text-primary-600 transition-colors">
                    View Conversations
                  </h3>
                  <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Monitor all customer-braider chats</p>
              </button>

              <button
                onClick={() => router.push('/admin/payments')}
                className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow text-left group"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base text-gray-900 font-semibold group-hover:text-primary-600 transition-colors">
                    View Payments
                  </h3>
                  <DollarSign className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Track transactions and revenue</p>
              </button>

              <button
                onClick={() => router.push('/admin/users')}
                className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow text-left group"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base text-gray-900 font-semibold group-hover:text-primary-600 transition-colors">
                    Manage Users
                  </h3>
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <p className="text-xs sm:text-sm text-gray-600">View and manage user accounts</p>
              </button>
            </div>

            {/* Activity Summary */}
            <div className="mt-6 sm:mt-8 bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Activity Summary</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">User Distribution</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Braiders</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600"
                            style={{
                              width: `${
                                stats.totalUsers > 0
                                  ? (stats.totalBraiders / stats.totalUsers) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {stats.totalBraiders}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Customers</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-600"
                            style={{
                              width: `${
                                stats.totalUsers > 0
                                  ? (stats.totalCustomers / stats.totalUsers) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {stats.totalCustomers}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Conversation Status</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Active</span>
                      <span className="text-sm font-semibold text-green-600">
                        {stats.activeConversations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Total</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.totalConversations}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
