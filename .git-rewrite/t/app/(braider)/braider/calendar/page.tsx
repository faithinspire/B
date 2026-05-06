'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  scheduled_date: string;
  status: string;
  notes: string;
}

export default function BraiderCalendar() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load bookings
  useEffect(() => {
    if (!user || user.role !== 'braider') return;

    const loadBookings = async () => {
      try {
        setLoading(true);
        setError('');

        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('bookings')
          .select('*')
          .eq('braider_id', user.id)
          .order('scheduled_date', { ascending: true });

        if (err) throw err;
        setBookings(data || []);
      } catch (err) {
        console.error('Error loading bookings:', err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  if (authLoading) {
    return <BraiderPageLayout title="Calendar" subtitle="Manage your bookings" loading children={null} />;
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  return (
    <BraiderPageLayout
      title="Calendar"
      subtitle="View and manage your bookings"
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
    >
      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <p className="font-bold text-gray-900">
                      {new Date(booking.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(booking.scheduled_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </div>
                  {booking.notes && (
                    <p className="text-gray-600 text-sm mt-2">{booking.notes}</p>
                  )}
                </div>
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No bookings yet</p>
          </div>
        )}
      </div>
    </BraiderPageLayout>
  );
}
