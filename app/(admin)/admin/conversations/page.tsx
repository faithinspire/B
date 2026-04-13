'use client';

import { useEffect, useState } from 'react';
import { Search, Loader, AlertCircle, RotateCcw, X, Eye } from 'lucide-react';

interface Conversation {
  id: string;
  booking_id: string;
  customer_name: string;
  braider_name: string;
  status: string;
  appointment_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

interface BookingDetails {
  booking: any;
  notes: any[];
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    let result = conversations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.customer_name.toLowerCase().includes(q) ||
        c.braider_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, conversations]);

  const loadConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/conversations', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (conversation: Conversation) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversation.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSelectedBooking(data);
    } catch (err) {
      console.error('Error:', err);
      setSelectedBooking(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-gray-600 mt-1">Monitor bookings and interactions</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={loadConversations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-600">
          No conversations found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{conversation.customer_name}</p>
                    <span className="text-gray-400">↔</span>
                    <p className="font-semibold">{conversation.braider_name}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(conversation.appointment_date).toLocaleDateString()} • ${conversation.total_amount}
                  </p>
                  {conversation.notes && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{conversation.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(conversation.status)}
                  <button
                    onClick={() => viewDetails(conversation)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0">
              <h2 className="font-bold">Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-12">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : selectedBooking.booking ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold">{selectedBooking.booking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Braider</p>
                    <p className="font-semibold">{selectedBooking.booking.braider_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">{selectedBooking.booking.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold">${selectedBooking.booking.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedBooking.booking.appointment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{selectedBooking.booking.location_address || 'N/A'}</p>
                  </div>
                </div>

                {selectedBooking.booking.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="bg-gray-50 p-3 rounded">{selectedBooking.booking.notes}</p>
                  </div>
                )}

                {selectedBooking.notes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Reviews</p>
                    <div className="space-y-2">
                      {selectedBooking.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-semibold">Rating: {note.rating} ⭐</p>
                          {note.comment && <p className="text-sm text-gray-600 mt-1">{note.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">No booking details available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
