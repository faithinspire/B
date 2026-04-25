'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import {
  BarChart3, Users, MessageSquare, DollarSign,
  TrendingUp, AlertCircle, RefreshCw, AlertTriangle,
  CheckCircle, Calendar, Loader,
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchStats]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const navItems = [
    { label: 'Dashboard', icon: BarChart3, href: '/admin', color: 'from-primary-600 to-primary-700' },
    { label: 'Verify', icon: CheckCircle, href: '/admin/verification', color: 'from-purple-600 to-purple-700' },
    { label: 'Users', icon: Users, href: '/admin/users', color: 'from-blue-600 to-blue-700' },
    { label: 'Conversations', icon: MessageSquare, href: '/admin/conversations', color: 'from-pink-600 to-pink-700' },
    { label: 'Bookings', icon: Calendar, href: '/admin/bookings', color: 'from-orange-600 to-orange-700' },
    { label: 'Payments', icon: DollarSign, href: '/admin/payments', color: 'from-green-600 to-green-700' },
    { label: 'Braiders', icon: Users, href: '/admin/braiders', color: 'from-indigo-600 to-indigo-700' },
    { label: 'Disputes', icon: AlertTriangle, href: '/admin/disputes', color: 'from-red-600 to-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Monitor platform activity'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-900 font-semibold text-sm">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchStats} className="mt-1 text-red-600 text-sm font-semibold hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !stats ? (
        <div className="flex justify-center py-12">
          <Loader className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalBraiders} braiders · {stats.totalCustomers} customers</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 font-medium">Conversations</p>
                <MessageSquare className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
              <p className="text-xs text-green-600 mt-1">{stats.activeConversations} active</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 font-medium">Bookings</p>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 font-medium">Revenue</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.pendingPayments} pending</p>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {navItems.map(item => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-left text-white hover:shadow-lg hover:scale-105 transition-all`}
              >
                <item.icon className="w-5 h-5 mb-2 opacity-90" />
                <p className="text-sm font-semibold">{item.label}</p>
              </button>
            ))}
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-semibold text-gray-900">Activity Summary</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-3">User Distribution</p>
                <div className="space-y-2">
                  {[
                    { label: 'Braiders', value: stats.totalBraiders, color: 'bg-primary-600' },
                    { label: 'Customers', value: stats.totalCustomers, color: 'bg-pink-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-20">{item.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${stats.totalUsers > 0 ? (item.value / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-3">Booking Status</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Total Bookings</span>
                    <span className="font-semibold text-gray-900">{stats.totalBookings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Pending Payments</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingPayments}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Active Conversations</span>
                    <span className="font-semibold text-green-600">{stats.activeConversations}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
