'use client';
// Universal chat page — works for any conversation (with or without booking)
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft, Phone, Video } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  read?: boolean;
}

interface ConvInfo {
  id: string;
  booking_id?: string | null;
  braider_id?: string | null;
  customer_id?: string | null;
  other_name: string;
  other_avatar?: string | null;
  status?: string;
}

export default function UniversalChatPage() {
  const router = useRouter();
  const params = useParams();
  const convId = params?.id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conv, setConv] = useState<ConvInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [braiderLocation, setBraiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !convId) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch conversation details
      const convRes = await fetch(`/api/conversations/${convId}`);
      let convData: any = null;
      if (convRes.ok) {
        convData = await convRes.json();
      } else {
        // Fallback: search in user's conversations
        const listRes = await fetch(`/api/conversations?user_id=${user.id}`);
        if (listRes.ok) {
          const list = await listRes.json();
          convData = list.find((c: any) => c.id === convId);
        }
      }

      if (!convData) throw new Error('Conversation not found');

      // Determine the other person
      const otherId = convData.braider_id === user.id ? convData.customer_id : convData.braider_id;
      let other_name = 'User';
      let other_avatar = null;

      if (otherId && supabase) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', otherId)
          .single();
        if (profile) {
          other_name = profile.full_name || 'User';
          other_avatar = profile.avatar_url;
        }
      }

      // Try braider_profiles for better name
      if (otherId) {
        try {
          const bpRes = await fetch(`/api/braiders/${otherId}`);
          if (bpRes.ok) {
            const bp = await bpRes.json();
            if (bp.full_name) other_name = bp.full_name;
            if (bp.avatar_url) other_avatar = bp.avatar_url;
          }
        } catch {}
      }

      setConv({ ...convData, other_name, other_avatar });

      // Fetch messages
      const msgRes = await fetch(`/api/messages/conversation/${convId}?limit=100`);
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d?.messages || d || []);
      }

      // Fetch braider location if applicable
      const braiderId = convData.braider_id;
      if (braiderId) {
        try {
          const lr = await fetch(`/api/location/braider/${braiderId}`);
          if (lr.ok) {
            const ld = await lr.json();
            if (ld?.latitude) setBraiderLocation(ld);
          }
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [user, convId]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  // Real-time message subscription
  useEffect(() => {
    if (!convId || !supabase) return;

    const ch = supabase
      .channel(`chat_${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload: any) => {
        const m = payload.new as Message;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();

    return () => { supabase?.removeChannel(ch); };
  }, [convId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conv) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: convId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      setSending(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: convId,
          sender_id: user.id,
          sender_role: user.role,
          content,
        }),
      });

      if (!res.ok) {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        const err = await res.json();
        throw new Error(err.error || 'Failed to send');
      }

      const sent = await res.json();
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? (sent.message || sent) : m));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!conv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-3">{error || 'Conversation not found'}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
          {conv.other_avatar
            ? <img src={conv.other_avatar} className="w-full h-full object-cover" alt="" />
            : conv.other_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{conv.other_name}</p>
          <p className="text-xs text-green-500 font-medium">Online</p>
        </div>

        <div className="flex items-center gap-1">
          {braiderLocation && (
            <button
              onClick={() => setShowMap(v => !v)}
              className={`p-2 rounded-lg transition-colors ${showMap ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Toggle map"
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Map strip (mobile) */}
        {showMap && braiderLocation && (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3" style={{ height: '160px' }}>
            <div className="h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500 text-sm">
                <MapPin className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                <p>Braider at {braiderLocation.latitude.toFixed(4)}, {braiderLocation.longitude.toFixed(4)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Send className="w-7 h-7 text-purple-500" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No messages yet</p>
              <p className="text-gray-400 text-xs mt-1">Say hello to {conv.other_name}!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-1">
                      {conv.other_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[75%] sm:max-w-xs lg:max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        (msg.is_read || msg.read)
                          ? <CheckCheck className="w-3 h-3 text-purple-400" />
                          : <Check className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar — always visible */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3 safe-area-bottom">
          {error && (
            <p className="text-red-500 text-xs mb-2 px-1">{error}</p>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${conv.other_name}...`}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-11 h-11 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm"
            >
              {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom nav spacer */}
      <div className="flex-shrink-0 h-20 md:hidden" />
    </div>
  );
}
