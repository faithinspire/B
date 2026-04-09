'use client';
import { useEffect, useState } from 'react';

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  admin_id: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  braider_name: string;
  message_count: number;
  last_message: string | null;
  last_message_time: string | null;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    let result = conversations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(q) ||
          c.braider_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, conversations]);

  async function fetchConversations() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/conversations');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch conversations');
      }
      const data = await res.json();
      setConversations(data);
      setFiltered(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search customer or braider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              Loading conversations...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              No conversations found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Braider
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Messages
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Last Message
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((conversation) => (
                  <tr key={conversation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {conversation.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {conversation.braider_name}
                    </td>
                    <td className="px-4 py-3">{statusBadge(conversation.status)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {conversation.message_count}
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                      {conversation.last_message || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedConversation(conversation)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Conversation Details</h2>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedConversation.customer_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Braider
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedConversation.braider_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Status
                  </p>
                  <p className="text-sm font-medium">
                    {statusBadge(selectedConversation.status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Messages
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedConversation.message_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Started
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedConversation.started_at).toLocaleDateString(
                      'en-GB',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Booking ID
                  </p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedConversation.booking_id}
                  </p>
                </div>
              </div>

              {selectedConversation.last_message && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Last Message
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedConversation.last_message}
                  </p>
                  {selectedConversation.last_message_time && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(
                        selectedConversation.last_message_time
                      ).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
