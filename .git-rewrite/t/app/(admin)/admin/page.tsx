'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Users, MessageSquare, CheckCircle, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalBraiders: number;
  pendingVerifications: number;
  activeConversations: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBraiders: 0,
    pendingVerifications: 0,
    activeConversations: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      fetchStats();
    }
  }, [authLoading, user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const menuItems = [
    { icon: CheckCircle, label: 'Verification', href: '/admin/verification', color: 'bg-blue-100 text-blue-600' },
    { icon: Users, label: 'Users', href: '/admin/users', color: 'bg-green-100 text-green-600' },
    { icon: MessageSquare, label: 'Conversations', href: '/admin/conversations', color: 'bg-purple-100 text-purple-600' },
    { icon: DollarSign, label: 'Payments', href: '/admin/payments', color: 'bg-yellow-100 text-yellow-600' },
    { icon: AlertCircle, label: 'Disputes', href: '/admin/disputes', color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.full_name || 'Admin'}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Braiders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBraiders}</p>
              </div>
              <Users className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Verification</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingVerifications}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Chats</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeConversations}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Main Menu Grid - 4 Primary Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="bg-white rounded-lg shadow hover:shadow-xl transition-all p-8 cursor-pointer h-full hover:scale-105 transform">
                    <div className={`${item.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{item.label}</h3>
                    <p className="text-gray-600 text-sm mt-2">Manage {item.label.toLowerCase()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Additional Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer h-full">
                    <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-gray-600 text-sm mt-1">Manage {item.label.toLowerCase()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
