'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft } from 'lucide-react';
import { CustomerLocationMap } from '@/app/components/CustomerLocationMap';

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
  braider_name?: string;
  braider_avatar?: string;
}

export default function CustomerChatPage() {
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
  const [braiderLocation, setBraiderLocation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !booking_id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/conversations?user_id=${user.id}&role=customer`);
      if (!res.ok) throw new Error('Failed to load conversations');
      const convList: any[] = await res.json();
      const conv = convList.find((c: any) => c.booking_id === booking_id);
      if (!conv) throw new Error('No conversation found. The braider may not have accepted yet.');

      if (conv.braider_id && supabase) {
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', conv.braider_id).single();
        if (profile) { conv.braider_name = profile.full_name; conv.braider_avatar = profile.avatar_url; }
      }
      setConversation(conv);

      const msgRes = await fetch(`/api/messages/conversation/${conv.id}?user_id=${user.id}&limit=100`);
      if (msgRes.ok) { const d = await msgRes.json(); setMessages(d?.messages || d || []); }

      if (conv.braider_id) {
        const locRes = await fetch(`/api/location/braider/${conv.braider_id}`);
        if (locRes.ok) { const locData = await locRes.json(); if (locData?.latitude) setBraiderLocation(locData); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally { setLoading(false); }
  }, [user, booking_id]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [user, authLoading, fetchData]);

  useEffect(() => {
    if (!conversation || !supabase) return;
    const channel = supabase.channel(`chat_customer_${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        })
      .subscribe();
    const locInterval = setInterval(async () => {
      if (!conversation.braider_id) return;
      const r = await fetch(`/api/location/braider/${conversation.braider_id}`);
      if (r.ok) { const d = await r.json(); if (d?.latitude) setBraiderLocation(d); }
    }, 15000);
    return () => { supabase?.removeChannel(channel); clearInterval(locInterval); };
  }, [conversation]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation) return;
    try {
      setSending(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, sender_id: user.id, sender_role: 'customer', content: newMessage.trim(), message_type: 'text' }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send'); }
    finally { setSending(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-10 h-10 text-primary-600 animate-spin" /></div>;
  if (!user || user.role !== 'customer') return null;

  if (error && !conversation) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <p className="text-red-600 font-semibold mb-2">Could not load chat</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button onClick={() => router.push('/messages')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Back to Messages</button>
      </div>
    </div>
  );

  if (!conversation) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">No conversation found for this booking.</p>
        <button onClick={() => router.push('/messages')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Back to Messages</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/messages')} className="p-1 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        {conversation.braider_avatar
          ? <img src={conversation.braider_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">{conversation.braider_name?.charAt(0)?.toUpperCase() || 'B'}</div>
        }
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{conversation.braider_name || 'Braider'}</p>
          <p className="text-xs text-gray-500">Booking: {booking_id.slice(0, 8)}...</p>
        </div>
        <button onClick={() => setShowMap(v => !v)} className={`p-2 rounded-lg transition-colors ${showMap ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 text-gray-500'}`}>
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow" style={{ height: '70vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0
              ? <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-sm">No messages yet — say hello!</p></div>
              : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl text-sm ${msg.sender_id === user.id ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                    <p>{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-60 justify-end">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.sender_id === user.id && (msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                    </div>
                  </div>
                </div>
              ))
            }
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100">
            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" disabled={sending} />
              <button type="submit" disabled={sending || !newMessage.trim()} className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-4">
          {showMap && (
            <div className="bg-white rounded-xl shadow p-3" style={{ height: '320px' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Braider Location</p>
              <div className="h-[270px]"><CustomerLocationMap braiderLocation={braiderLocation} /></div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow p-4 text-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Booking Info</h3>
            <p className="text-gray-500 text-xs">ID: <span className="font-mono">{booking_id.slice(0, 12)}...</span></p>
            <p className="text-gray-500 text-xs mt-1">Status: <span className="capitalize text-gray-700">{conversation.status}</span></p>
            <p className={`text-xs mt-1 ${braiderLocation ? 'text-green-600' : 'text-gray-400'}`}>
              {braiderLocation ? 'Braider is sharing location' : 'Braider location not available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
