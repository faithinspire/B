'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import {
  Users,
  MessageSquare,
  DollarSign,
  AlertCircle,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Calendar,
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

interface RecentUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface RecentBooking {
  id: string;
  customer_name: string;
  braider_name?: string;
  status: string;
  appointment_date: string;
  total_amount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard stats');

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());

      // Fetch recent users using session token
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const usersRes = await fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (usersRes.ok) {
            const users = await usersRes.json();
            setRecentUsers((users as RecentUser[]).slice(0, 5));
          }
        }
      }

      // Recent bookings come from dashboard API
      if (data.recentBookings) {
        setRecentBookings(data.recentBookings);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;

    fetchStats();
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Monitor platform activity</p>
            </div>
            <button
              onClick={fetchStats}
              className="p-2 sm:p-3 bg-primary-100 hover:bg-primary-200 rounded-lg transition-smooth"
              title="Refresh"
            >
              <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-900 font-semibold text-sm sm:text-base">Error</p>
              <p className="text-red-700 text-xs sm:text-sm mt-1 break-words">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-xs sm:text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-10 sm:w-12 h-10 sm:h-12 text-primary-600 animate-spin mx-auto mb-3 sm:mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            <p className="text-sm sm:text-base text-gray-600 font-semibold">Loading dashboard...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid - Fully Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Total Users */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Total Users</h3>
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  {stats.totalBraiders} braiders, {stats.totalCustomers} customers
                </p>
              </div>

              {/* Conversations */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Conversations</h3>
                  <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-accent-600" />
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
                <p className="text-xs text-green-600 mt-1 sm:mt-2">{stats.activeConversations} active</p>
              </div>

              {/* Bookings */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Bookings</h3>
                  <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">All time</p>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm text-gray-600 font-semibold">Revenue</h3>
                  <DollarSign className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">{stats.pendingPayments} pending</p>
              </div>
            </div>

            {/* Navigation Buttons - Fully Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
              <button
                onClick={() => router.push('/admin')}
                className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl hover:scale-105 transition-all text-left group text-white"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold truncate">Overview</h3>
                  <BarChart3 className="w-3 sm:w-4 h-3 sm:h-4 text-white/80 flex-shrink-0" />
                </div>
                <p className="text-xs text-white/90 hidden sm:block">Dashboard</p>
              </button>

              <button
                onClick={() => router.push('/admin/conversations')}
                className="bg-gradient-to-br from-accent-600 to-accent-700 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl hover:scale-105 transition-all text-left group text-white"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold truncate">Conversations</h3>
                  <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4 text-white/80 flex-shrink-0" />
                </div>
                <p className="text-xs text-white/90 hidden sm:block">Monitor</p>
              </button>

              <button
                onClick={() => router.push('/admin/payments')}
                className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl hover:scale-105 transition-all text-left group text-white"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold truncate">Payments</h3>
                  <DollarSign className="w-3 sm:w-4 h-3 sm:h-4 text-white/80 flex-shrink-0" />
                </div>
                <p className="text-xs text-white/90 hidden sm:block">Revenue</p>
              </button>

              <button
                onClick={() => router.push('/admin/users')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl hover:scale-105 transition-all text-left group text-white"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold truncate">Users</h3>
                  <Users className="w-3 sm:w-4 h-3 sm:h-4 text-white/80 flex-shrink-0" />
                </div>
                <p className="text-xs text-white/90 hidden sm:block">Manage</p>
              </button>

              <button
                onClick={() => router.push('/admin/disputes')}
                className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl hover:scale-105 transition-all text-left group text-white"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold truncate">Disputes</h3>
                  <AlertTriangle className="w-3 sm:w-4 h-3 sm:h-4 text-white/80 flex-shrink-0" />
                </div>
                <p className="text-xs text-white/90 hidden sm:block">Issues</p>
              </button>
            </div>

            {/* Activity Summary + Recent Data - 2 column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Activity Summary */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Activity Summary</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">User Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-700 w-20">Braiders</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600"
                            style={{ width: `${stats.totalUsers > 0 ? (stats.totalBraiders / stats.totalUsers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-6 text-right">{stats.totalBraiders}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-700 w-20">Customers</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-600"
                            style={{ width: `${stats.totalUsers > 0 ? (stats.totalCustomers / stats.totalUsers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-6 text-right">{stats.totalCustomers}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Conversations</p>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-700">{stats.activeConversations}</p>
                        <p className="text-xs text-green-600">Active</p>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-700">{stats.totalConversations}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recent Bookings</h3>
                  </div>
                  <button
                    onClick={() => router.push('/admin/conversations')}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    View all
                  </button>
                </div>
                {recentBookings.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentBookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">{b.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {b.appointment_date ? new Date(b.appointment_date).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            b.status === 'completed' ? 'bg-green-100 text-green-700' :
                            b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">${b.total_amount?.toFixed(0) ?? '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recent Sign-ups</h3>
                </div>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="text-xs text-primary-600 hover:underline"
                >
                  View all
                </button>
              </div>
              {recentUsers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No users yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{u.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          u.role === 'braider' ? 'bg-primary-100 text-primary-700' :
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
