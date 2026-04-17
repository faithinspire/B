'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useSupabaseBookingStore } from '@/store/supabaseBookingStore';
import { Calendar, MapPin, DollarSign, AlertCircle, Loader, CheckCircle, Clock, MessageCircle, Navigation } from 'lucide-react';
import Link from 'next/link';
import dynamic_import from 'next/dynamic';

const BraiderLocationMap = dynamic_import(
  () => import('@/app/components/BraiderLocationMap').then(m => ({ default: m.BraiderLocationMap })),
  { ssr: false, loading: () => <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center"><Loader className="w-6 h-6 text-purple-500 animate-spin" /></div> }
);

export default function BraiderBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const { getBookingsByBraider, updateBookingStatus, loading } = useSupabaseBookingStore();
  const [localBookings, setLocalBookings] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'braider') {
      router.push('/');
      return;
    }

    // Load braider's bookings
    loadBookings();
  }, [user, authLoading, router]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      const braiderBookings = await getBookingsByBraider(user.id);
      setLocalBookings(braiderBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      if (newStatus === 'confirmed') {
        // Call accept endpoint which creates the conversation
        const response = await fetch('/api/bookings/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, braiderId: user?.id }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to accept booking');
        }
      } else {
        await updateBookingStatus(bookingId, newStatus as any);
      }

      setLocalBookings(localBookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'escrowed': return 'bg-indigo-100 text-indigo-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex flex-col">
      {/* Header - Fixed positioning relative to scrollable content */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-serif font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your appointments and bookings</p>
        </div>
      </div>

      {/* Main content area with proper spacing for bottom navbar */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          </div>
        ) : localBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No bookings yet</p>
            <p className="text-gray-500">Your bookings will appear here once customers book your services</p>
          </div>
        ) : (
          <div className="space-y-6">
            {localBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Customer Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                  </div>

                  {/* Service Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Service</p>
                    <p className="font-semibold text-gray-900">{booking.service_name}</p>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Date & Time
                    </p>
                    <p className="font-semibold text-gray-900">
                      {new Date(booking.appointment_date).toLocaleDateString()} at{' '}
                      {new Date(booking.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Your Payout
                    </p>
                    <p className="font-semibold text-primary-600">${booking.braider_payout?.toFixed(2) || booking.service_price?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </p>
                  <p className="text-gray-900">{booking.location_address}</p>
                </div>

                {/* Live Map for confirmed/active bookings */}
                {(booking.status === 'confirmed' || booking.status === 'accepted' || booking.status === 'escrowed') && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      Live Customer Location
                    </p>
                    <div className="h-48 rounded-xl overflow-hidden">
                      <BraiderLocationMap booking_id={booking.id} />
                    </div>
                  </div>
                )}

                {/* Status & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-smooth font-semibold text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-smooth font-semibold text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {(booking.status === 'confirmed' || booking.status === 'accepted') && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Link
                        href={`/braider/messages/${booking.id}`}
                        className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold text-sm flex items-center gap-2 justify-center"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Link>
                      <button
                        onClick={() => handleStatusChange(booking.id, 'completed')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth font-semibold text-sm"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="w-full sm:w-auto">
                      <p className="text-xs text-gray-600 mb-1">Customer Notes:</p>
                      <p className="text-sm text-gray-700 italic">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for navbar */}
      <div className="h-20"></div>
    </div>
  );
}
