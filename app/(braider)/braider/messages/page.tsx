'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { MessageCircle, Search, AlertCircle } from 'lucide-react';

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
  unread_count?: number;
  customer_name?: string;
  customer_avatar?: string;
  last_message?: string;
  last_message_time?: string;
}

export default function BraiderMessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setError(undefined);
      const response = await fetch(
        `/api/conversations?user_id=${user.id}&role=braider`,
        { method: 'GET' }
      );

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

  // Initialize and setup refresh interval
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

    // Fetch on mount
    fetchConversations();

    // Setup refresh interval (30 seconds)
    const interval = setInterval(fetchConversations, 30000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, authLoading, router, fetchConversations]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <BraiderPageLayout
        title="Messages"
        subtitle="Communicate with customers"
        loading
        children={null}
      />
    );
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  const filteredConversations = conversations.filter((conv) =>
    (conv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BraiderPageLayout
      title="Messages"
      subtitle="Communicate with your customers"
      loading={loading}
      error={error}
      onErrorDismiss={() => setError(undefined)}
    >
      <div className="max-w-4xl mx-auto">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
          />
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

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No conversations yet</p>
            <p className="text-gray-500 mt-2">
              {searchQuery ? 'No conversations match your search' : 'Conversations will appear here when customers book'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/braider/messages/${conv.booking_id}`)}
                className="w-full p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-smooth border border-gray-200 hover:border-primary-300 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{conv.customer_name || 'Customer'}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread_count && conv.unread_count > 0 && (
                    <span className="ml-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {conv.last_message_time
                    ? new Date(conv.last_message_time).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'No messages'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </BraiderPageLayout>
  );
}
