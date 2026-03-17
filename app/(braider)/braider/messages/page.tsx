'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  customer_name?: string;
  customer_avatar?: string;
  status: 'active' | 'completed' | 'archived';
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  booking_status?: string;
  appointment_date?: string;
}

export default function BraiderMessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchConversations = useCallback(async () => {
    if (!user || user.role !== 'braider') return;

    try {
      setLoading(true);
      setError(null);

      if (!supabase) throw new Error('Supabase not initialized');

      // Fetch conversations with booking details
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select(`
          id,
          booking_id,
          customer_id,
          status,
          started_at,
          bookings (
            id,
            status,
            appointment_date,
            customer_id
          ),
          messages (
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .eq('braider_id', user.id)
        .order('updated_at', { ascending: false });

      if (convErr) throw convErr;

      // Fetch customer details
      const customerIds = [...new Set(convData?.map(c => c.customer_id) || [])];
      const { data: customers } = await supabase
        .from('auth.users')
        .select('id, full_name, avatar_url')
        .in('id', customerIds);

      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);

      // Process conversations
      const processed = convData?.map(conv => {
        const customer = customerMap.get(conv.customer_id);
        const messages = conv.messages || [];
        const lastMessage = messages[messages.length - 1];
        const unreadCount = messages.filter(m => m.sender_id !== user.id && m.sender_id !== user.id).length;

        return {
          id: conv.id,
          booking_id: conv.booking_id,
          customer_id: conv.customer_id,
          customer_name: customer?.full_name || 'Unknown',
          customer_avatar: customer?.avatar_url,
          status: conv.status,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at,
          unread_count: unreadCount,
          booking_status: conv.bookings?.status,
          appointment_date: conv.bookings?.appointment_date,
        };
      }) || [];

      setConversations(processed);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'braider') return;

    fetchConversations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`braider_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `braider_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, authLoading, fetchConversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filterStatus]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Messages</h1>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No messages yet</p>
            <p className="text-gray-500 text-sm mt-1">Customers will appear here once they book your services</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/braider/messages/${conv.booking_id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 border-l-4 border-primary-600 cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  {conv.customer_avatar ? (
                    <img
                      src={conv.customer_avatar}
                      alt={conv.customer_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
                      {conv.customer_name?.charAt(0) || 'C'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{conv.customer_name}</h3>
                    <p className="text-xs text-gray-500">
                      {conv.appointment_date ? new Date(conv.appointment_date).toLocaleDateString() : 'No date'}
                    </p>
                  </div>

                  {conv.unread_count ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold">
                      {conv.unread_count}
                    </span>
                  ) : null}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                  {conv.booking_status === 'accepted' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Accepted
                    </span>
                  )}
                  {conv.booking_status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {conv.booking_status === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Last Message */}
                {conv.last_message && (
                  <div className="text-sm text-gray-600 truncate mb-2">
                    {conv.last_message}
                  </div>
                )}

                {conv.last_message_time && (
                  <p className="text-xs text-gray-500">
                    {new Date(conv.last_message_time).toLocaleTimeString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
