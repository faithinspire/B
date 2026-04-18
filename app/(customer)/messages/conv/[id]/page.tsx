'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Send, Loader, ArrowLeft, CheckCheck, Check } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read?: boolean;
  is_read?: boolean;
}

export default function ConversationChatPage() {
  const router = useRouter();
  const params = useParams();
  const convId = params?.id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState('Seller');
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadMessages = useCallback(async () => {
    if (!user || !convId) return;
    try {
      const res = await fetch(`/api/messages/conversation/${convId}?user_id=${user.id}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        // Handle both array and { messages: [...] } shapes
        const msgs = Array.isArray(data) ? data : (data?.messages || []);
        setMessages(msgs);
      }
    } catch (err) {
      // silent fail on poll
    }
  }, [user, convId]);

  const loadData = useCallback(async () => {
    if (!user || !convId) return;
    setLoading(true);
    try {
      // Get conversation + other user info via API
      const convRes = await fetch(`/api/conversations/${convId}`);
      if (convRes.ok) {
        const convData = await convRes.json();
        // Handle both { conversation: {...} } and direct object shapes
        const conv = convData.conversation || convData;
        const otherId = conv.braider_id === user.id ? conv.customer_id : conv.braider_id;
        if (otherId) {
          const profileRes = await fetch(`/api/admin/users/${otherId}`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            setOtherName(profile.full_name || profile.data?.full_name || 'Seller');
            setOtherAvatar(profile.avatar_url || profile.data?.avatar_url || null);
          }
        }
      }

      // Load messages via API (uses service role, bypasses RLS)
      await loadMessages();
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, convId, loadMessages]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
      // Poll for new messages every 3 seconds
      pollRef.current = setInterval(loadMessages, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, authLoading, loadData, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !convId || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    setError('');
    try {
      // Determine sender role
      const senderRole = user.role === 'braider' ? 'braider' : 'customer';
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: convId,
          sender_id: user.id,
          sender_role: senderRole,
          content,
          message_type: 'text',
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send');
      }
      const data = await res.json();
      // Optimistically add message
      if (data.message) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
      // Reload to get latest
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push('/messages')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
          {otherAvatar
            ? <img src={otherAvatar} className="w-full h-full object-cover" alt="" />
            : otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{otherName}</p>
          <p className="text-xs text-green-500">Active</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                msg.sender_id === user.id
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm'
              }`}>
                <p className="leading-relaxed">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs justify-end ${
                  msg.sender_id === user.id ? 'text-purple-200' : 'text-gray-400'
                }`}>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.sender_id === user.id && (
                    (msg.read || msg.is_read)
                      ? <CheckCheck className="w-3 h-3" />
                      : <Check className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
        {error && (
          <p className="text-red-500 text-xs mb-2 text-center">{error}</p>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-gray-50 transition-all"
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0 shadow-md"
          >
            {sending
              ? <Loader className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </form>
      </div>
    </div>
  );
}
