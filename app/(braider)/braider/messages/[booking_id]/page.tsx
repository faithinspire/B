'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check } from 'lucide-react';
import { useBraiderLocationTracking } from '@/app/hooks/useBraiderLocationTracking';
import { useBraiderSubscription } from '@/app/hooks/useBraiderSubscription';
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
  status: 'active' | 'completed' | 'archived';
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
  const [error, setError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isTracking, startTracking, stopTracking } = useBraiderLocationTracking(booking_id);
  const { isConnected } = useBraiderSubscription(booking_id, (newMsg) => {
    setMessages((prev) => [...prev, newMsg]);
    setConnectionStatus('connected');
  });

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch conversation and messages
  useEffect(() => {
    if (!user || !booking_id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(undefined);

        if (!supabase) {
          throw new Error('Supabase not initialized');
        }

        // Fetch conversation
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('booking_id', booking_id)
          .eq('braider_id', user.id)
          .single();

        if (convErr) throw convErr;
        setConversation(convData);

        // Fetch messages
        const { data: msgData, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;
        setMessages(msgData || []);

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', convData.id)
          .neq('sender_id', user.id);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, booking_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation || !supabase) return;

    try {
      setSending(true);
      setError(undefined);

      const { error: err } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: newMessage,
        is_read: false,
      });

      if (err) throw err;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <BraiderPageLayout
        title="Chat"
        subtitle="Communicate with customer"
        loading
        children={null}
      />
    );
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  if (loading) {
    return (
      <BraiderPageLayout
        title="Chat"
        subtitle="Communicate with customer"
        loading
        children={null}
      />
    );
  }

  if (!conversation) {
    return (
      <BraiderPageLayout
        title="Chat"
        subtitle="Communicate with customer"
        error="Conversation not found"
        onErrorDismiss={() => router.push('/braider/messages')}
      >
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">This conversation could not be found.</p>
          <button
            onClick={() => router.push('/braider/messages')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Messages
          </button>
        </div>
      </BraiderPageLayout>
    );
  }

  return (
    <BraiderPageLayout
      title={conversation.customer_name || 'Customer'}
      subtitle="Chat with customer"
      error={error}
      onErrorDismiss={() => setError(undefined)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2 flex flex-col h-[600px] bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {conversation.customer_avatar && (
                <img
                  src={conversation.customer_avatar}
                  alt={conversation.customer_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {conversation.customer_name || 'Customer'}
                </h3>
                <p className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? (
                    <span className="text-green-600">● Connected</span>
                  ) : (
                    <span className="text-gray-500">● Connecting...</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLocationMap(!showLocationMap)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="View location"
            >
              <MapPin className="w-5 h-5 text-primary-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id === user.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.sender_id === user.id && (
                        msg.is_read ? (
                          <CheckCheck className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Location Section */}
        <div className="lg:col-span-1 space-y-4">
          {/* Location Map */}
          {showLocationMap && (
            <div className="bg-white rounded-lg shadow p-4 h-[300px]">
              <BraiderLocationMap booking_id={booking_id} />
            </div>
          )}

          {/* Location Sharing */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Location Sharing</h3>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isTracking
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {isTracking ? 'Stop Sharing' : 'Share Location'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {isTracking
                ? 'Your location is being shared with the customer'
                : 'Share your location so customer can track your arrival'}
            </p>
          </div>

          {/* Booking Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Booking Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Booking ID</p>
                <p className="font-mono text-gray-900">{booking_id}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="capitalize text-gray-900">{conversation.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BraiderPageLayout>
  );
}
