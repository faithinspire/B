'use client';

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

        // Load users
        const { data: usersData } = await supabase
          .from('auth.users')
          .select('*');

        const { data: braidersData } = await supabase
          .from('braider_profiles')
          .select('*');

        setStats({
          totalBookings,
          totalRevenue,
          pendingPayments,
          activeBookings,
          totalUsers: usersData?.length || 0,
          totalBraiders: braidersData?.length || 0,
        });

        setPayments(paymentsData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    
    // Load tracking data
    try {
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      
      const { data } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      setTrackingData(data);
    } catch (err) {
      console.error('Error loading tracking data:', err);
    }
  };

  const handleReleasePayment = async (paymentId: string) => {
    try {
      const response = await fetch('/api/payments/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          adminId: user?.id,
        }),
      });

      if (response.ok) {
        alert('Payment released successfully');
        loadDashboardData();
      } else {
        alert('Failed to release payment');
      }
    } catch (error) {
      console.error('Error releasing payment:', error);
      alert('Error releasing payment');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24" style={{ paddingTop: 0, marginTop: 0 }}>
      <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: '2rem' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Real-time platform monitoring and management</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">{stats.totalBookings}</p>
              </div>
              <Clock className="w-12 h-12 text-primary-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Bookings</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeBookings}</p>
              </div>
              <MapPinned className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingPayments}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-purple-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Braiders</p>
                <p className="text-3xl font-bold text-pink-600 mt-2">{stats.totalBraiders}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-pink-100" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
          {(['overview', 'bookings', 'payments', 'users', 'disputes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-smooth border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bookings List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-2xl font-serif font-bold mb-6">Active Bookings</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {bookings.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No bookings found</p>
                  ) : (
                    bookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => handleSelectBooking(booking)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedBooking?.id === booking.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{booking.braider_name}</h3>
                            <p className="text-sm text-gray-600">{booking.service_name}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'in_progress'
                                ? 'bg-green-100 text-green-700'
                                : booking.status === 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location_address}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <span className="text-sm font-semibold text-primary-600">${booking.service_price}</span>
                          <span className="text-xs text-gray-500">{booking.appointment_date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {selectedBooking && (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-2xl font-serif font-bold mb-6">Booking Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Braider</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.braider_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.service_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-semibold text-gray-900">${selectedBooking.service_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.location_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.appointment_date}</p>
                  </div>

                  {trackingData && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Real-Time Tracking</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-semibold">{trackingData.distance} miles</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">ETA:</span>
                          <span className="font-semibold">{trackingData.eta} minutes</span>
                        </div>
                        <button
                          onClick={() => setShowMap(!showMap)}
                          className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold flex items-center justify-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          {showMap ? 'Hide Map' : 'View Map'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Payment Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Booking ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{payment.booking_id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">${payment.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : payment.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handleReleasePayment(payment.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth font-semibold text-sm flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Release
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Booking Completion Rate</span>
                    <span className="font-semibold text-gray-900">
                      {stats.totalBookings > 0
                        ? ((stats.activeBookings / stats.totalBookings) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Average Transaction</span>
                    <span className="font-semibold text-gray-900">
                      ${stats.totalBookings > 0 ? (stats.totalRevenue / stats.totalBookings).toFixed(2) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Payment Pending Rate</span>
                    <span className="font-semibold text-gray-900">
                      {payments.length > 0
                        ? ((stats.pendingPayments / payments.length) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    Manage Users
                  </button>
                  <button className="w-full px-4 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-smooth font-semibold flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    View Disputes
                  </button>
                  <button className="w-full px-4 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-smooth font-semibold flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
