'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Send, Loader, MapPin, Check, CheckCheck, MoreVertical } from 'lucide-react';

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

interface Msg {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read?: boolean;
  is_read?: boolean;
}

interface ConvInfo {
  id: string;
  other_id: string;
  other_name: string;
  other_avatar: string | null;
  status: string;
}

function Avatar({ name, url, size = 10 }: { name: string; url?: string | null; size?: number }) {
  const s = `w-${size} h-${size}`;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0`}>
      {url ? <img src={url} className="w-full h-full object-cover" alt={name}/> : name.charAt(0).toUpperCase()}
    </div>
  );
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDay(ts: string) {
  const d = new Date(ts), t = new Date();
  if (d.toDateString() === t.toDateString()) return 'Today';
  const y = new Date(t); y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const urlId = params?.booking_id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [conv, setConv] = useState<ConvInfo | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) router.push('/login');
  }, [user, authLoading, router]);

  const loadConv = useCallback(async () => {
    if (!user || !urlId) return;
    setLoading(true); setError(null);
    try {
      const db = getDb();
      // Find conversation by booking_id OR by id
      const { data: rows } = await db.from('conversations').select('*')
        .or(`id.eq.${urlId},booking_id.eq.${urlId}`)
        .limit(1);

      let row = rows?.[0];

      // Fallback: search by participant
      if (!row) {
        const { data: rows2 } = await db.from('conversations').select('*')
          .or(`customer_id.eq.${user.id},braider_id.eq.${user.id},participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
          .order('updated_at', { ascending: false }).limit(20);
        row = rows2?.find((r: any) => r.booking_id === urlId || r.id === urlId);
      }

      // AUTO-CREATE: if still not found, look up the booking and create the conversation
      if (!row) {
        const { data: booking } = await db.from('bookings').select('*').eq('id', urlId).maybeSingle();
        if (booking && booking.customer_id && booking.braider_id) {
          const now = new Date().toISOString();
          const { data: created, error: createErr } = await db.from('conversations').insert({
            booking_id: urlId,
            customer_id: booking.customer_id,
            braider_id: booking.braider_id,
            status: 'active',
            started_at: now,
            created_at: now,
            updated_at: now,
          }).select().single();
          if (!createErr && created) {
            row = created;
          } else {
            const { data: created2 } = await db.from('conversations').insert({
              participant1_id: booking.customer_id,
              participant2_id: booking.braider_id,
              created_at: now,
            }).select().single();
            if (created2) row = created2;
          }
        }
      }

      if (!row) { setError('Conversation not found. The booking may not have been accepted yet.'); setLoading(false); return; }

      // Determine other party
      const otherId = row.customer_id ||
        (row.participant1_id === user.id ? row.participant2_id : row.participant1_id);

      let other_name = 'Customer', other_avatar = null;
      if (otherId) {
        const { data: p } = await db.from('profiles').select('full_name,avatar_url').eq('id', otherId).single();
        if (p) { other_name = p.full_name || 'Customer'; other_avatar = p.avatar_url; }
      }

      setConv({ id: row.id, other_id: otherId, other_name, other_avatar, status: row.status || 'active' });

      // Load messages
      const { data: msgRows } = await db.from('messages').select('*')
        .eq('conversation_id', row.id).order('created_at', { ascending: true }).limit(200);
      setMsgs(msgRows || []);

      // Mark as read
      if (msgRows?.length) {
        const unread = msgRows.filter((m: Msg) => m.sender_id !== user.id && !m.read && !m.is_read);
        if (unread.length) {
          await db.from('messages').update({ read: true }).in('id', unread.map((m: Msg) => m.id));
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [user, urlId]);

  useEffect(() => {
    if (!authLoading && user) loadConv();
  }, [user, authLoading, loadConv]);

  // Real-time subscription
  useEffect(() => {
    if (!conv) return;
    const db = getDb();
    const ch = db.channel('chat_' + conv.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + conv.id,
      }, (p) => {
        const m = p.new as Msg;
        setMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
        // Mark read if from other party
        if (m.sender_id !== user?.id) {
          db.from('messages').update({ read: true }).eq('id', m.id).then(() => {});
        }
      })
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [conv, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const content = text.trim();
    if (!content || !conv || !user || sending) return;
    setText('');
    setSending(true);
    setError(null);

    const tempId = 'tmp_' + Date.now();
    const tempMsg: Msg = {
      id: tempId, conversation_id: conv.id, sender_id: user.id,
      content, created_at: new Date().toISOString(), read: false,
    };
    setMsgs(prev => [...prev, tempMsg]);

    try {
      const db = getDb();
      const { data, error: err } = await db.from('messages').insert({
        conversation_id: conv.id,
        sender_id: user.id,
        content,
        read: false,
        created_at: new Date().toISOString(),
      }).select().single();

      if (err) throw new Error(err.message);
      setMsgs(prev => prev.map(m => m.id === tempId ? data : m));

      // Update conversation updated_at
      await db.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conv.id);
    } catch (e: any) {
      setError('Failed to send: ' + e.message);
      setMsgs(prev => prev.filter(m => m.id !== tempId));
      setText(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Group messages by day
  const groups: { day: string; messages: Msg[] }[] = [];
  msgs.forEach(m => {
    const day = formatDay(m.created_at);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.messages.push(m);
    else groups.push({ day, messages: [m] });
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 text-purple-600 animate-spin"/>
      </div>
    );
  }
  if (!user || user.role !== 'braider') return null;

  if (!conv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-red-500"/>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Chat not available</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">{error || 'Conversation not found.'}</p>
        <button onClick={() => router.push('/braider/messages')}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors">
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/braider/messages')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700"/>
        </button>
        <Avatar name={conv.other_name} url={conv.other_avatar} size={10}/>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate leading-tight">{conv.other_name}</p>
          <p className="text-xs text-green-500 font-medium">Active now</p>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-500"/>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar name={conv.other_name} url={conv.other_avatar} size={16}/>
            <p className="mt-4 font-semibold text-gray-800">{conv.other_name}</p>
            <p className="text-sm text-gray-500 mt-1">Say hello to get started!</p>
          </div>
        ) : (
          groups.map(({ day, messages }) => (
            <div key={day}>
              {/* Day separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200"/>
                <span className="text-xs text-gray-400 font-medium px-2">{day}</span>
                <div className="flex-1 h-px bg-gray-200"/>
              </div>
              {messages.map((m, i) => {
                const isOwn = m.sender_id === user.id;
                const prevSame = i > 0 && messages[i-1].sender_id === m.sender_id;
                const nextSame = i < messages.length - 1 && messages[i+1].sender_id === m.sender_id;
                const isTemp = m.id.startsWith('tmp_');

                return (
                  <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${prevSame ? 'mt-0.5' : 'mt-3'}`}>
                    {/* Other avatar — only show on last in group */}
                    {!isOwn && (
                      <div className="w-8 flex-shrink-0 mr-2 self-end">
                        {!nextSame && <Avatar name={conv.other_name} url={conv.other_avatar} size={8}/>}
                      </div>
                    )}
                    <div className="max-w-[75%] flex flex-col">
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-purple-600 text-white ' + (prevSame ? 'rounded-2xl rounded-tr-md' : nextSame ? 'rounded-2xl rounded-br-md' : 'rounded-2xl')
                          : 'bg-white text-gray-900 shadow-sm border border-gray-100 ' + (prevSame ? 'rounded-2xl rounded-tl-md' : nextSame ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl')
                      } ${isTemp ? 'opacity-60' : ''}`}>
                        {m.content}
                      </div>
                      {/* Time + read receipt — only on last in group */}
                      {!nextSame && (
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-400">{formatTime(m.created_at)}</span>
                          {isOwn && (
                            (m.read || m.is_read)
                              ? <CheckCheck className="w-3.5 h-3.5 text-purple-500"/>
                              : <Check className="w-3.5 h-3.5 text-gray-400"/>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message..."
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-purple-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all hover:bg-purple-700 active:scale-95 flex-shrink-0"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          </button>
        </div>
      </div>
    </div>
  );
}
