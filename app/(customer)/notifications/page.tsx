'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Bell, Trash2, CheckCircle, Loader } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check if user is authenticated and is a customer
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'customer') {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  const notifications = [
    {
      id: 1,
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking with Sarah is confirmed for March 15, 2026',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'message',
      title: 'New Message',
      message: 'Sarah sent you a message about your upcoming appointment',
      time: '4 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'review',
      title: 'Leave a Review',
      message: 'How was your experience with Maria? Leave a review',
      time: '1 day ago',
      read: true,
    },
    {
      id: 4,
      type: 'promotion',
      title: 'Special Offer',
      message: 'Get 20% off your next booking with code BRAIDLY20',
      time: '2 days ago',
      read: true,
    },
  ];

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">Notifications</h1>
          <p className="text-primary-100">Stay updated with your bookings and messages</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, idx) => (
              <div
                key={notification.id}
                className={`rounded-2xl p-6 flex items-start justify-between animate-slide-up ${
                  notification.read
                    ? 'bg-white border border-gray-200'
                    : 'bg-primary-50 border-2 border-primary-200'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-primary-600'}`} />
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                </div>
                <button className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-smooth flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mark All as Read */}
        {notifications.some((n) => !n.read) && (
          <div className="mt-8 text-center">
            <button className="text-primary-600 font-semibold hover:text-primary-700 flex items-center justify-center gap-2 mx-auto">
              <CheckCircle className="w-5 h-5" />
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
