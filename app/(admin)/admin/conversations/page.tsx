'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { MessageCircle, Search, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  status: 'active' | 'completed' | 'archived';
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  braider_name?: string;
  message_count?: number;
  last_message?: string;
  last_message_time?: string;
}

export default function AdminConversationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/conversations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'admin') {
      return;
    }

    fetchConversations();

    // Refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, fetchConversations]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      (conv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.braider_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.booking_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Conversations</h1>
          <p className="text-gray-600">Monitor all customer-braider conversations</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'archived'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchConversations}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            <p className="text-gray-600 font-semibold">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No conversations found</p>
            <p className="text-gray-500 mt-2">
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 md:p-6 flex flex-col"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Booking ID</p>
                    <p className="text-sm font-mono text-gray-900">{conv.booking_id.substring(0, 12)}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      conv.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : conv.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {conv.status}
                  </span>
                </div>

                {/* Card Info */}
                <div className="space-y-3 mb-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-600">Customer</p>
                    <p className="text-sm text-gray-900">{conv.customer_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Braider</p>
                    <p className="text-sm text-gray-900">{conv.braider_name || 'Unknown'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Messages</p>
                      <p className="text-lg font-bold text-gray-900">{conv.message_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="text-gray-900">{new Date(conv.started_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {conv.last_message && (
                    <div>
                      <p className="text-xs text-gray-600">Last Message</p>
                      <p className="text-sm text-gray-900 line-clamp-2">{conv.last_message}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedConversation(selectedConversation === conv.id ? null : conv.id)}
                    className="w-full px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-smooth font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {selectedConversation === conv.id ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        View
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Conversations</p>
            <p className="text-3xl font-bold text-gray-900">{conversations.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {conversations.filter((c) => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Completed</p>
            <p className="text-3xl font-bold text-blue-600">
              {conversations.filter((c) => c.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Archived</p>
            <p className="text-3xl font-bold text-gray-600">
              {conversations.filter((c) => c.status === 'archived').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
