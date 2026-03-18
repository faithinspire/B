'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search, Clock, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
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

      // Use the API route (service role) to bypass RLS
      const res = await fetch(`/api/conversations?user_id=${user.id}&role=braider`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load conversations');
      }
      const convData: any[] = await res.json();

      if (!convData || convData.length === 0) {
        setConversations([]);
        return;
      }

      // Fetch booking details for each conversation
      const bookingIds = convData.map(c => c.booking_id).filter(Boolean);
      let bookingsMap = new Map<string, any>();

      if (bookingIds.length > 0 && supabase) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, status, appointment_date, customer_name, customer_id')
          .in('id', bookingIds);
        if (bookings) {
          bookings.forEach(b => bookingsMap.set(b.id, b));
        }
      }

      // Fetch last message for each conversation
      let lastMsgMap = new Map<string, any>();
      if (supabase) {
        for (const conv of convData) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, is_read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (msgs && msgs.length > 0) {
            lastMsgMap.set(conv.id, msgs[0]);
          }
        }
      }

      // Fetch customer profiles
      const customerIds = [...new Set(convData.map(c => c.customer_id).filter(Boolean))];
      let profileMap = new Map<string, any>();
      if (customerIds.length > 0 && supabase) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', customerIds);
        if (profiles) {
          profiles.forEach(p => profileMap.set(p.id, p));
        }
      }

      const processed: Conversation[] = convData.map(conv => {
        const booking = bookingsMap.get(conv.booking_id);
        const profile = profileMap.get(conv.customer_id);
        const lastMsg = lastMsgMap.get(conv.id);

        const customerName =
          profile?.full_name ||
          booking?.customer_name ||
          'Customer';

        return {
          id: conv.id,
          booking_id: conv.booking_id,
          customer_id: conv.customer_id,
          customer_name: customerName,
          customer_avatar: profile?.avatar_url,
          status: conv.status || 'active',
          last_message: lastMsg?.content,
          last_message_time: lastMsg?.created_at,
          unread_count: conv.unread_count || 0,
          booking_status: booking?.status,
          appointment_date: booking?.appointment_date,
        };
      });

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

    if (!supabase) return;

    // Real-time subscription for new messages
    const channel = supabase
      .channel(`braider_msgs_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchConversations(); }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [user, authLoading, fetchConversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = !searchQuery ||
        conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filterStatus]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'braider') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={fetchConversations}
              className="p-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-primary-600" />
            </button>
          </div>
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
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'completed')}
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
            <div className="flex-1">
              <p className="text-red-900 font-semibold text-sm">Error loading messages</p>
              <p className="text-red-700 text-xs mt-1">{error}</p>
              <button onClick={fetchConversations} className="mt-2 text-red-600 text-xs font-semibold hover:underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading your conversations...</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No conversations yet</p>
            <p className="text-gray-400 text-sm mt-1">
              {conversations.length === 0
                ? 'Accept a booking to start chatting with customers'
                : 'No conversations match your search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/braider/messages/${conv.booking_id}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-all p-4 border-l-4 border-primary-600 block"
              >
                <div className="flex items-start gap-3 mb-3">
                  {conv.customer_avatar ? (
                    <img
                      src={conv.customer_avatar}
                      alt={conv.customer_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {conv.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{conv.customer_name}</h3>
                    <p className="text-xs text-gray-500">
                      {conv.appointment_date
                        ? new Date(conv.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'No date set'}
                    </p>
                  </div>
                  {conv.unread_count ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {conv.booking_status === 'accepted' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Accepted
                    </span>
                  )}
                  {conv.booking_status === 'confirmed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Confirmed
                    </span>
                  )}
                  {conv.booking_status === 'escrowed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  )}
                  {conv.booking_status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {conv.booking_status === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    conv.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {conv.status}
                  </span>
                </div>

                {conv.last_message ? (
                  <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No messages yet — tap to start</p>
                )}
                {conv.last_message_time && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
