'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Search, Calendar, Clock, MapPin, User, X, Loader, AlertCircle, CheckCircle, Pause } from 'lucide-react';

interface Booking {
  id: string;
  customer_id: string;
  braider_id: string;
  customer_name: string;
  braider_name: string;
  service_name: string;
  service_type?: string;
  location_address: string;
  location?: string;
  appointment_date: string;
  appointment_time?: string;
  status: 'pending' | 'confirmed' | 'accepted' | 'escrowed' | 'completed' | 'cancelled' | 'ongoing';
  service_price: number;
  total_amount?: number;
  braider_payout?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let result = bookings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.customer_name.toLowerCase().includes(q) ||
        b.braider_name.toLowerCase().includes(q) ||
        b.service_type.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, bookings]);

  async function fetchBookings() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch bookings');
      }
      const data = await res.json();
      setBookings(data);
      setFiltered(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'ongoing':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(date);
      if (time) {
        return `${dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${time}`;
      } else {
        return `${dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch {
      return time ? `${date} at ${time}` : date;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor all service bookings and appointments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, braider, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{booking.service_name || booking.service_type || 'Service'}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">{booking.customer_name}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold">{booking.braider_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(booking.appointment_date, booking.appointment_time || '')}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {booking.location_address || booking.location || 'Location not specified'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${(booking.total_amount || booking.service_price || 0).toFixed(2)}</p>
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowModal(true);
                    }}
                    className="mt-3 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Booking Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Booking ID</p>
                  <p className="text-gray-900 font-mono">{selectedBooking.id.substring(0, 12)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedBooking.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Customer</p>
                  <p className="text-gray-900">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Braider</p>
                  <p className="text-gray-900">{selectedBooking.braider_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Service</p>
                  <p className="text-gray-900">{selectedBooking.service_name || selectedBooking.service_type || 'Service'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${(selectedBooking.total_amount || selectedBooking.service_price || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Date & Time</p>
                  <p className="text-gray-900">{formatDateTime(selectedBooking.appointment_date, selectedBooking.appointment_time || '')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Location</p>
                  <p className="text-gray-900">{selectedBooking.location_address || selectedBooking.location || 'Location not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Created</p>
                  <p className="text-gray-900">{new Date(selectedBooking.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Updated</p>
                  <p className="text-gray-900">{new Date(selectedBooking.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Notes</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
