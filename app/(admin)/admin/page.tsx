'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, TrendingUp, DollarSign, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalBraiders: number;
  activeBookings: number;
  pendingVerifications: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBraiders: 0,
    activeBookings: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to BraidMee Admin Panel</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm font-medium">Total Users</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-2">Active customers</p>
        </div>

        {/* Total Braiders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm font-medium">Total Braiders</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalBraiders}</p>
          <p className="text-xs text-gray-500 mt-2">Registered professionals</p>
        </div>

        {/* Active Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm font-medium">Active Bookings</p>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
          <p className="text-xs text-gray-500 mt-2">In progress</p>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm font-medium">Pending Verifications</p>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting review</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">In escrow</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/braiders"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all hover:border-primary-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Manage Braiders</h3>
              <CheckCircle className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600">Verify and manage braider profiles</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all hover:border-primary-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <Users className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600">View and manage customer accounts</p>
          </Link>

          <Link
            href="/admin/bookings"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all hover:border-primary-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Track Bookings</h3>
              <TrendingUp className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600">Monitor all service bookings</p>
          </Link>

          <Link
            href="/admin/payments"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all hover:border-primary-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Release Payments</h3>
              <DollarSign className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600">Process and release escrow payments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
