import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

function write(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
  console.log('Written:', filePath);
}

// ─── SHARED NOTIFICATION HOOK ─────────────────────────────────────────────────
const useNotifications = `'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  booking_id?: string;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await window.fetch('/api/notifications?userId=' + userId);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setNotifications(list);
        setUnreadCount(list.filter((n: AppNotification) => !n.read).length);
      }
    } catch {}
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!userId || !supabase) return;
    const ch = supabase.channel('notif_hook_' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: 'user_id=eq.' + userId,
      }, (p) => {
        const n = p.new as AppNotification;
        setNotifications(prev => [n, ...prev]);
        setUnreadCount(c => c + 1);
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    await window.fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, read: true }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    await Promise.all(
      notifications.filter(n => !n.read).map(n =>
        window.fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: n.id, read: true }),
        }).catch(() => {})
      )
    );
  }, [notifications]);

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetch };
}
`;

// ─── CUSTOMER CHAT PAGE ───────────────────────────────────────────────────────
const customerChat = `'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import {
  Send, MapPin, CheckCheck, Check, Loader, ArrowLeft,
  Navigation, Smile, X, ChevronDown
} from 'lucide-react';

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
  booking_id: string;
  braider_id: string;
  customer_id: string;
  status: string;
  braider_name?: string;
  braider_avatar?: string;
}
interface BraiderLoc {
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
  const [braiderLoc, setBraiderLoc] = useState<BraiderLoc | null>(null);
  const [isOnline, setIsOnline] = useState(true);
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
      let conv: Conversation | null = Array.isArray(convList)
        ? (convList.find((c: Conversation) => c.booking_id === booking_id) ?? null)
        : null;
      if (!conv) throw new Error('No conversation found. The braider may not have accepted yet.');
      if (conv.braider_id && supabase) {
        const { data: p } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', conv.braider_id).single();
        if (p) conv = { ...conv, braider_name: p.full_name, braider_avatar: p.avatar_url };
      }
      setConversation(conv);
      const msgRes = await fetch('/api/messages/conversation/' + conv.id + '?user_id=' + user.id + '&limit=100');
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d?.messages || (Array.isArray(d) ? d : []));
      }
      // Fetch initial braider location
      if (conv.braider_id) {
        const lr = await fetch('/api/location/braider/' + conv.braider_id + '?booking_id=' + booking_id);
        if (lr.ok) { const ld = await lr.json(); if (ld?.latitude) setBraiderLoc(ld); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally { setLoading(false); }
  }, [user, booking_id]);

  useEffect(() => { if (!authLoading && user) fetchData(); }, [user, authLoading, fetchData]);

  // Real-time: new messages
  useEffect(() => {
    if (!conversation || !supabase) return;
    const ch = supabase.channel('msg_cust_' + conversation.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + conversation.id,
      }, (p) => {
        const m = p.new as Message;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe((status) => setIsOnline(status === 'SUBSCRIBED'));
    return () => { supabase?.removeChannel(ch); };
  }, [conversation]);

  // Real-time: braider location — instant Uber-style
  useEffect(() => {
    if (!booking_id || !supabase) return;
    const ch = supabase.channel('loc_cust_' + booking_id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'location_tracking',
        filter: 'booking_id=eq.' + booking_id,
      }, (p) => {
        const loc = p.new as BraiderLoc & { booking_id: string };
        if (loc?.latitude) { setBraiderLoc(loc); setShowMap(true); }
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [booking_id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError(null);
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
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_role: 'customer',
          content,
          message_type: 'text',
        }),
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

  const fmt = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts: string) => {
    const d = new Date(ts), t = new Date();
    if (d.toDateString() === t.toDateString()) return 'Today';
    const y = new Date(t); y.setDate(t.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  const grouped = messages.reduce<Record<string, Message[]>>((g, m) => {
    const d = fmtDate(m.created_at);
    if (!g[d]) g[d] = [];
    g[d].push(m);
    return g;
  }, {});

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: BG, backgroundSize: 'cover' }}>
      <div className="bg-white/90 backdrop-blur rounded-2xl p-8 text-center shadow-xl">
        <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3"/>
        <p className="text-gray-600 text-sm font-medium">Loading chat...</p>
      </div>
    </div>
  );
  if (!user || user.role !== 'customer') return null;

  if (!conversation) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundImage: BG, backgroundSize: 'cover' }}>
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-red-500"/>
        </div>
        <p className="text-red-600 font-semibold mb-2">{error || 'No conversation found'}</p>
        <p className="text-gray-500 text-sm mb-5">The braider needs to accept your booking first.</p>
        <button onClick={() => router.push('/messages')} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">Back to Messages</button>
      </div>
    </div>
  );

  const otherName = conversation.braider_name || 'Braider';
  const otherAvatar = conversation.braider_avatar;

  return (
    <div className="flex flex-col h-screen relative" style={{ backgroundImage: BG, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/50 pointer-events-none"/>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 py-2.5 flex items-center gap-3 shadow-md">
        <button onClick={() => router.push('/messages')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-700"/>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow overflow-hidden">
          {otherAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" alt=""/> : otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{otherName}</p>
          <div className="flex items-center gap-1.5">
            <div className={\`w-2 h-2 rounded-full \${isOnline ? 'bg-green-500' : 'bg-gray-400'}\`}/>
            <p className="text-xs text-gray-500">{isOnline ? 'Online' : 'Connecting...'}</p>
          </div>
        </div>
        {braiderLoc && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            <span className="text-xs text-green-700 font-semibold">Live</span>
          </div>
        )}
        <button
          onClick={() => setShowMap(v => !v)}
          className={\`p-2 rounded-xl transition-colors flex-shrink-0 \${showMap ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}\`}
        >
          <MapPin className="w-5 h-5"/>
        </button>
      </div>

      {/* Location Panel */}
      {showMap && (
        <div className="relative z-10 flex-shrink-0 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-600"/>
                <span className="text-sm font-semibold text-gray-800">Braider Location</span>
                {braiderLoc && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Live</span>}
              </div>
              <button onClick={() => setShowMap(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500"/>
              </button>
            </div>
            {braiderLoc ? (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <Navigation className="w-6 h-6 text-white"/>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{otherName} is on the way</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {braiderLoc.latitude.toFixed(5)}, {braiderLoc.longitude.toFixed(5)}
                    </p>
                    {braiderLoc.created_at && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Updated {new Date(braiderLoc.created_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={\`https://www.google.com/maps?q=\${braiderLoc.latitude},\${braiderLoc.longitude}\`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  <MapPin className="w-4 h-4"/> Open in Google Maps
                </a>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                <p className="text-sm text-gray-500">Waiting for braider to share location...</p>
                <p className="text-xs text-gray-400 mt-1">You'll be notified automatically when they do</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/90 backdrop-blur rounded-2xl p-8 text-center shadow-lg max-w-xs">
              <Smile className="w-12 h-12 text-purple-400 mx-auto mb-3"/>
              <p className="text-gray-800 font-semibold">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">Say hello to {otherName}!</p>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/20"/>
                <span className="text-xs text-white/80 font-medium bg-black/30 backdrop-blur px-3 py-1 rounded-full">{date}</span>
                <div className="flex-1 h-px bg-white/20"/>
              </div>
              {(msgs as Message[]).map((msg, i) => {
                const isOwn = msg.sender_id === user.id;
                const showAv = !isOwn && (i === 0 || (msgs as Message[])[i-1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} className={\`flex \${isOwn ? 'justify-end' : 'justify-start'} mb-1\`}>
                    {!isOwn && (
                      <div className={\`w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-1 overflow-hidden \${showAv ? 'bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow' : 'opacity-0'}\`}>
                        {showAv && (otherAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" alt=""/> : otherName.charAt(0))}
                      </div>
                    )}
                    <div className={\`max-w-[75%] flex flex-col \${isOwn ? 'items-end' : 'items-start'}\`}>
                      <div className={\`px-4 py-2.5 rounded-2xl shadow \${isOwn
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm'
                      } \${msg.id?.startsWith('tmp_') ? 'opacity-60' : ''}\`}>
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                      </div>
                      <div className={\`flex items-center gap-1 mt-0.5 px-1 \${isOwn ? 'flex-row-reverse' : ''}\`}>
                        <span className="text-xs text-white/60">{fmt(msg.created_at)}</span>
                        {isOwn && ((msg.read || msg.is_read)
                          ? <CheckCheck className="w-3.5 h-3.5 text-blue-300"/>
                          : <Check className="w-3.5 h-3.5 text-white/40"/>
                        )}
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

      {/* Input */}
      <div className="relative z-10 flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-3 shadow-2xl">
        {error && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-xs flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-3.5 h-3.5 text-red-400"/></button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 focus-within:border-purple-400 focus-within:bg-white transition-all">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              disabled={sending}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          </button>
        </form>
      </div>
    </div>
  );
}
`;
