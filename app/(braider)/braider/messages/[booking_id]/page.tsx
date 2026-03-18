'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft } from 'lucide-react';
import { useBraiderLocationTracking } from '@/app/hooks/useBraiderLocationTracking';
import { BraiderLocationMap } from '@/app/components/BraiderLocationMap';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  status: string;
  customer_name?: string;
  customer_avatar?: string;
}

export default function BraiderChatPage() {
  const router = useRouter();
  const params = useParams();
  const booking_id = params?.booking_id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isTracking, startTracking, stopTracking } = useBraiderLocationTracking(booking_id);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !booking_id) return;
    try {
      setLoading(true);
      setError(null);

      // Use API route (service role) to bypass RLS
      const res = await fetch(`/api/conversations?user_id=${user.id}&role=braider`);
      if (!res.ok) throw new Error('Failed to load conversations');
      const convList: any[] = await res.json();

      // Find the conversation for this booking
      let conv = convList.find((c: any) => c.booking_id === booking_id);

      // If no conversation exists, create one via the accept endpoint logic
      if (!conv) {
        // Try to get booking info to create conversation
        const bookingRes = await fetch(`/api/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id,
            braider_id: user.id,
            customer_id: '', // will be filled from booking
          }),
        });
        if (bookingRes.ok) {
          conv = await bookingRes.json();
        } else {
          throw new Error('Conversation not found for this booking. Make sure the booking is accepted first.');
        }
      }

      // Fetch customer profile
      if (conv.customer_id && supabase) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', conv.customer_id)
          .single();
        if (profile) {
          conv.customer_name = profile.full_name;
          conv.customer_avatar = profile.avatar_url;
        }
      }

      setConversation(conv);

      // Fetch messages via API
      const msgRes = await fetch(`/api/messages/conversation/${conv.id}?user_id=${user.id}&limit=100`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        // API returns { messages: [...] } paginated object
        setMessages(msgData?.messages || msgData || []);
      }

      // Mark messages as read
      if (supabase) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id);
      }
    } catch (err) {
      console.error('Error fetching chat data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [user, booking_id]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchData();
  }, [user, authLoading, fetchData]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversation || !supabase) return;

    const channel = supabase
      .channel(`chat_braider_${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [conversation]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation) return;
    try {
      setSending(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_role: 'braider',
          content: newMessage.trim(),
          message_type: 'text',
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'braider') return null;

  if (error && !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-2">Could not load chat</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/braider/messages')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No conversation found for this booking.</p>
          <button
            onClick={() => router.push('/braider/messages')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/braider/messages')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        {conversation.customer_avatar ? (
          <img src={conversation.customer_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
            {conversation.customer_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{conversation.customer_name || 'Customer'}</p>
          <p className="text-xs text-gray-500">Booking: {booking_id.slice(0, 8)}...</p>
        </div>
        <button
          onClick={() => setShowMap((v) => !v)}
          className={`p-2 rounded-lg transition-colors ${showMap ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 text-gray-500'}`}
          title="Toggle map"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow" style={{ height: '70vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No messages yet — say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl text-sm ${
                    msg.sender_id === user.id
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <p>{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-60 justify-end">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.sender_id === user.id && (
                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100">
            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right panel: Map + Location sharing */}
        <div className="lg:col-span-1 space-y-4">
          {/* Map */}
          {showMap && (
            <div className="bg-white rounded-xl shadow p-3" style={{ height: '280px' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Location</p>
              <div className="h-[230px]">
                <BraiderLocationMap booking_id={booking_id} />
              </div>
            </div>
          )}

          {/* Location sharing */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Share Your Location</h3>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                isTracking
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {isTracking ? 'Stop Sharing' : 'Share Location'}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {isTracking ? 'Customer can see your location' : 'Let customer track your arrival'}
            </p>
          </div>

          {/* Booking info */}
          <div className="bg-white rounded-xl shadow p-4 text-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Booking Info</h3>
            <p className="text-gray-500 text-xs">ID: <span className="font-mono">{booking_id.slice(0, 12)}...</span></p>
            <p className="text-gray-500 text-xs mt-1">Status: <span className="capitalize text-gray-700">{conversation.status}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
