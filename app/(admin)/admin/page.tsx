'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  MapPin,
  CheckCircle,
  Clock,
  Loader,
  MapPinned,
} from 'lucide-react';

interface Booking {
  id: string;
  customer_id: string;
  braider_id: string;
  customer_name: string;
  braider_name: string;
  service_name: string;
  service_price: number;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  location_address: string;
  notes: string;
}

interface AdminStats {
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  activeBookings: number;
  totalUsers: number;
  totalBraiders: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useSupabaseAuthStore();

  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeBookings: 0,
    totalUsers: 0,
    totalBraiders: 0,
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'payments' | 'users' | 'disputes'>('overview');
  const [showMap, setShowMap] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (!bookingsError && bookingsData) {
        setBookings(bookingsData as Booking[]);

        // Calculate stats
        const totalBookings = bookingsData.length;
        const activeBookings = bookingsData.filter((b: any) => b.status === 'in_progress').length;
        const totalRevenue = bookingsData.reduce((sum: number, b: any) => sum + (b.service_price || 0), 0);

        // Load payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*');

        const pendingPayments = paymentsData?.filter((p: any) => p.status === 'pending').length || 0;

        // Load users via API endpoint (uses service role, bypasses RLS)
        const usersRes = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${user?.id || ''}`,
          },
        });

        let totalUsers = 0;
        let totalBraiders = 0;

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          totalUsers = usersData.length;
          totalBraiders = usersData.filter((u: any) => u.role === 'braider').length;
        }

        setStats({
          totalBookings,
          totalRevenue,
          pendingPayments,
          activeBookings,
          totalUsers,
          totalBraiders,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your platform overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          {/* Active Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeBookings}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Payments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingPayments}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          {/* Total Braiders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Braiders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBraiders}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-semibold text-gray-900">Manage Users</p>
            <p className="text-sm text-gray-600">View all users</p>
          </button>

          <button
            onClick={() => router.push('/admin/conversations')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <MapPinned className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-semibold text-gray-900">Conversations</p>
            <p className="text-sm text-gray-600">Monitor chats</p>
          </button>

          <button
            onClick={() => router.push('/admin/payments')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-semibold text-gray-900">Payments</p>
            <p className="text-sm text-gray-600">View transactions</p>
          </button>

          <button
            onClick={() => router.push('/admin/verification')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <CheckCircle className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-semibold text-gray-900">Verification</p>
            <p className="text-sm text-gray-600">Verify braiders</p>
          </button>

          <button
            onClick={() => router.push('/admin/disputes')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <p className="font-semibold text-gray-900">Disputes</p>
            <p className="text-sm text-gray-600">Resolve issues</p>
          </button>

          <button
            onClick={() => router.push('/admin/financials')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <TrendingUp className="w-6 h-6 text-indigo-600 mb-2" />
            <p className="font-semibold text-gray-900">Financials</p>
            <p className="text-sm text-gray-600">View reports</p>
          </button>
        </div>
      </div>
    </div>
  );
}
