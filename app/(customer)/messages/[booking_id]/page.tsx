'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft, Navigation, Smile } from 'lucide-react';
import { CustomerLocationMap } from '@/app/components/CustomerLocationMap';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read?: boolean;
  is_read?: boolean;
  sender_role?: string;
}

interface Conversation {
  id: string;
  booking_id?: string | null;
  braider_id: string;
  customer_id: string;
  status: string;
  braider_name?: string;
  braider_avatar?: string;
}

interface BraiderLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  created_at?: string;
}

const BG = "url('/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png')";

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
  const [showMap, setShowMap] = useState(false);
  const [braiderLocation, setBraiderLocation] = useState<BraiderLocation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !booking_id) return;
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/conversations?user_id=' + user.id + '&role=customer');
      if (!res.ok) throw new Error('Failed to load conversations');
      const convList = await res.json();
      // Match by booking_id OR by conv.id (fallback for old-schema convs without booking_id)
      let conv: Conversation | null = Array.isArray(convList)
        ? (convList.find((c: Conversation) => c.booking_id === booking_id || c.id === booking_id) ?? null)
        : null;
      if (!conv) throw new Error('No conversation found. The braider may not have accepted yet.');
      if (conv.braider_id && supabase) {
        const { data: p } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', conv.braider_id).single();
        if (p) conv = { ...conv, braider_name: (p as any).full_name, braider_avatar: (p as any).avatar_url };
      }
      setConversation(conv);
      const msgRes = await fetch('/api/messages/conversation/' + conv.id + '?user_id=' + user.id + '&limit=100');
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d?.messages || (Array.isArray(d) ? d : []));
      }
      if (conv.braider_id) {
        const lr = await fetch('/api/location/braider/' + conv.braider_id + '?booking_id=' + booking_id);
        if (lr.ok) { const ld = await lr.json(); if (ld?.latitude) setBraiderLocation(ld); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally { setLoading(false); }
  }, [user, booking_id]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  // Real-time: new messages
  useEffect(() => {
    if (!conversation || !supabase) return;
    const ch = supabase
      .channel('chat_customer_' + conversation.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + conversation.id,
      }, (p) => {
        const m = p.new as Message;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [conversation]);

  // Real-time: braider location
  useEffect(() => {
    if (!conversation?.braider_id || !supabase) return;
    const ch = supabase
      .channel('braider_loc_' + booking_id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'location_tracking',
        filter: 'booking_id=eq.' + booking_id,
      }, (p) => {
        const loc = p.new as BraiderLocation & { booking_id: string };
        if (loc?.latitude) setBraiderLocation(loc);
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [conversation, booking_id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    const tempMsg: Message = {
      id: 'tmp_' + Date.now(),
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      read: false,
      sender_role: 'customer',
    };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, sender_id: user.id, sender_role: 'customer', content, message_type: 'text' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? (data as Message) : m));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts: string) => {
    const d = new Date(ts); const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupedMessages = messages.reduce<Record<string, Message[]>>((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: BG, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center shadow-xl">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3"/>
          <p className="text-gray-600 text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }
  if (!user || user.role !== 'customer') return null;

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundImage: BG, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-purple-600"/>
          </div>
          <p className="text-red-600 font-semibold mb-2">{error || 'No conversation found'}</p>
          <p className="text-gray-500 text-sm mb-5">The braider needs to accept your booking first.</p>
          <button onClick={() => router.push('/messages')} className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">Back to Messages</button>
        </div>
      </div>
    );
  }

  const otherName = conversation.braider_name || 'Braider';
  const otherAvatar = conversation.braider_avatar;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundImage: BG, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-[2px] pointer-events-none"/>
      <div className="relative flex-shrink-0 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/messages')} className="p-2 hover:bg-purple-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700"/>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm overflow-hidden">
          {otherAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" alt={otherName}/> : otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{otherName}</p>
          <p className="text-xs text-purple-600 font-medium">Booking #{String(booking_id).slice(0, 8)}</p>
        </div>
        <button onClick={() => setShowMap(v => !v)} className={`p-2 rounded-xl transition-colors ${showMap ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'}`} title="Toggle Map">
          <MapPin className="w-5 h-5"/>
        </button>
        {braiderLocation && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            <span className="text-xs text-green-700 font-medium">Live</span>
          </div>
        )}
      </div>

      {showMap && (
        <div className="relative flex-shrink-0 bg-white/90 backdrop-blur border-b border-purple-100 shadow-sm" style={{ height: '260px' }}>
          <div className="h-full p-3 flex gap-3">
            <div className="flex-1 rounded-xl overflow-hidden shadow-sm">
              <CustomerLocationMap braiderLocation={braiderLocation} braiderName={otherName} bookingId={booking_id}/>
            </div>
            <div className="w-32 flex flex-col gap-2">
              <div className="bg-white/90 rounded-xl shadow-sm border border-blue-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${braiderLocation ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}/>
                  <p className="text-xs font-semibold text-gray-700">{braiderLocation ? 'Braider Live' : 'Not sharing'}</p>
                </div>
                {braiderLocation?.created_at && (
                  <p className="text-xs text-gray-400">Updated {new Date(braiderLocation.created_at).toLocaleTimeString()}</p>
                )}
              </div>
              <div className="bg-white/90 rounded-xl shadow-sm border border-purple-100 p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">Booking</p>
                <p className="text-gray-500 font-mono">{String(booking_id).slice(0, 10)}...</p>
                <p className="text-gray-500 mt-1 capitalize">{conversation.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center shadow-lg">
              <Smile className="w-10 h-10 text-purple-400 mx-auto mb-2"/>
              <p className="text-gray-700 font-medium">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">Say hello to get started!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/30"/>
                <span className="text-xs text-white font-medium bg-black/30 backdrop-blur px-3 py-1 rounded-full">{date}</span>
                <div className="flex-1 h-px bg-white/30"/>
              </div>
              {msgs.map((msg, i) => {
                const isOwn = msg.sender_id === user.id;
                const showAvatar = !isOwn && (i === 0 || msgs[i-1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}>
                    {!isOwn && (
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-1 overflow-hidden ${showAvatar ? 'bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow-sm' : 'opacity-0'}`}>
                        {showAvatar && (otherAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" alt=""/> : otherName.charAt(0))}
                      </div>
                    )}
                    <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2.5 rounded-2xl shadow-md ${isOwn ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm' : 'bg-white/95 backdrop-blur text-gray-900 rounded-bl-sm border border-purple-100'} ${msg.id?.startsWith('tmp_') ? 'opacity-70' : ''}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs text-white/70">{formatTime(msg.created_at)}</span>
                        {isOwn && ((msg.read || msg.is_read) ? <CheckCheck className="w-3.5 h-3.5 text-blue-300"/> : <Check className="w-3.5 h-3.5 text-white/50"/>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef}/>
      </div>

      <div className="relative flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-purple-100 px-4 py-3 shadow-lg">
        {error && <p className="text-red-500 text-xs mb-2 px-1">{error}</p>}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 bg-white/80 border border-purple-200 rounded-2xl px-4 py-2.5 focus-within:border-purple-400 focus-within:bg-white transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              disabled={sending}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
            />
          </div>
          <button type="submit" disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex-shrink-0">
            {sending ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          </button>
        </form>
      </div>
    </div>
  );
}
