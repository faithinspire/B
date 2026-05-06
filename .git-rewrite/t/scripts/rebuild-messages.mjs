import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
const root = process.cwd();
function write(rel, content) {
  const full = resolve(root, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log('✅', rel);
}

// ─── SHARED CHAT LOGIC (used in both braider + customer chat) ─────────────────
// The chat page template — parameterized by role
function buildChatPage(role) {
  const isBraider = role === 'braider';
  const otherRole = isBraider ? 'customer' : 'braider';
  const otherLabel = isBraider ? 'Customer' : 'Braider';
  const backPath = isBraider ? '/braider/messages' : '/messages';
  const mapComponent = isBraider ? 'BraiderLocationMap' : 'CustomerLocationMap';
  const mapImport = isBraider
    ? `import { BraiderLocationMap } from '@/app/components/BraiderLocationMap';`
    : `import { CustomerLocationMap } from '@/app/components/CustomerLocationMap';`;
  const trackingImport = isBraider
    ? `import { useBraiderLocationTracking } from '@/app/hooks/useBraiderLocationTracking';`
    : '';
  const trackingHook = isBraider
    ? `const { isTracking, startTracking, stopTracking, currentPosition } = useBraiderLocationTracking(booking_id as string);`
    : '';
  const locationState = isBraider ? '' : `const [braiderLocation, setBraiderLocation] = useState(null);`;
  const locationPoll = isBraider ? '' : `
      // Poll braider location every 10s
      const locInterval = setInterval(async () => {
        if (!conv?.braider_id) return;
        try {
          const lr = await fetch('/api/location/braider/' + conv.braider_id + '?booking_id=' + booking_id);
          if (lr.ok) { const ld = await lr.json(); if (ld?.latitude) setBraiderLocation(ld); }
        } catch {}
      }, 10000);
      return () => { supabase?.removeChannel(ch); clearInterval(locInterval); };`;
  const locationCleanup = isBraider ? `return () => { supabase?.removeChannel(ch); };` : '';
  const mapSection = isBraider ? `
              <BraiderLocationMap booking_id={booking_id as string} braiderCurrentLocation={currentPosition}/>` : `
              <CustomerLocationMap braiderLocation={braiderLocation} braiderName={conversation?.braider_name || 'Braider'}/>`;
  const locationPanel = isBraider ? `
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-purple-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-purple-600"/> Location Sharing
            </h3>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={\`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all \${isTracking ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}\`}
            >
              <MapPin className="w-4 h-4"/>
              {isTracking ? 'Stop Sharing Location' : 'Share My Location'}
            </button>
            {isTracking && <p className="text-xs text-green-600 text-center mt-2 font-medium">● Live — customer can see you</p>}
          </div>` : `
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={\`w-2 h-2 rounded-full \${braiderLocation ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}\`}/>
              <p className="text-xs font-semibold text-gray-700">{braiderLocation ? 'Braider is sharing location' : 'Location not shared yet'}</p>
            </div>
            {braiderLocation && <p className="text-xs text-gray-400">Updated {new Date(braiderLocation.created_at || Date.now()).toLocaleTimeString()}</p>}
          </div>`;

  return `'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft, Navigation, Phone, MoreVertical, Smile } from 'lucide-react';
${mapImport}
${trackingImport}

export default function ${isBraider ? 'Braider' : 'Customer'}ChatPage() {
  const router = useRouter();
  const params = useParams();
  const booking_id = params?.booking_id;
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showMap, setShowMap] = useState(false);
  ${locationState}
  ${trackingHook}
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== '${role}')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !booking_id) return;
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/conversations?user_id=' + user.id + '&role=${role}');
      if (!res.ok) throw new Error('Failed to load conversations');
      const convList = await res.json();
      let conv = Array.isArray(convList) ? convList.find(c => c.booking_id === booking_id) : null;
      if (!conv) throw new Error('No conversation found. ${isBraider ? 'Accept the booking first.' : 'The braider may not have accepted yet.'}');
      // Enrich with profile
      if (conv.${otherRole}_id && supabase) {
        const { data: p } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', conv.${otherRole}_id).single();
        if (p) conv = { ...conv, ${otherRole}_name: p.full_name, ${otherRole}_avatar: p.avatar_url };
      }
      setConversation(conv);
      const msgRes = await fetch('/api/messages/conversation/' + conv.id + '?user_id=' + user.id + '&limit=100');
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d?.messages || (Array.isArray(d) ? d : []));
      }
      ${!isBraider ? `// Fetch braider location
      if (conv.braider_id) {
        const lr = await fetch('/api/location/braider/' + conv.braider_id + '?booking_id=' + booking_id);
        if (lr.ok) { const ld = await lr.json(); if (ld?.latitude) setBraiderLocation(ld); }
      }` : ''}
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally { setLoading(false); }
  }, [user, booking_id]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  useEffect(() => {
    if (!conversation || !supabase) return;
    const ch = supabase
      .channel('chat_${role}_' + conversation.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + conversation.id },
        p => { const m = p.new; setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]); })
      .subscribe();
    ${isBraider ? locationCleanup : locationPoll}
  }, [conversation${!isBraider ? ', booking_id' : ''}]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    // Optimistic update
    const tempMsg = { id: 'tmp_' + Date.now(), conversation_id: conversation.id, sender_id: user.id, content, created_at: new Date().toISOString(), read: false, sender_role: '${role}' };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, sender_id: user.id, sender_role: '${role}', content, message_type: 'text' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      // Replace temp with real
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts) => {
    const d = new Date(ts); const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8e0f5 0%, #dce8ff 100%)' }}>
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3"/>
          <p className="text-gray-600 text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }
  if (!user || user.role !== '${role}') return null;

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e8e0f5 0%, #dce8ff 100%)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-purple-600"/>
          </div>
          <p className="text-red-600 font-semibold mb-2">{error || 'No conversation found'}</p>
          <p className="text-gray-500 text-sm mb-5">${isBraider ? 'Accept the booking first to start chatting.' : 'The braider needs to accept your booking first.'}</p>
          <button onClick={() => router.push('${backPath}')} className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">Back to Messages</button>
        </div>
      </div>
    );
  }

  const otherName = conversation.${otherRole}_name || '${otherLabel}';
  const otherAvatar = conversation.${otherRole}_avatar;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(135deg, #ede9f7 0%, #dce8ff 50%, #e8f0fe 100%)' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('${backPath}')} className="p-2 hover:bg-purple-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700"/>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
          {otherAvatar ? <img src={otherAvatar} className="w-full h-full rounded-full object-cover" alt={otherName}/> : otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{otherName}</p>
          <p className="text-xs text-purple-600 font-medium">Booking #{String(booking_id).slice(0, 8)}</p>
        </div>
        <button onClick={() => setShowMap(v => !v)} className={\`p-2 rounded-xl transition-colors \${showMap ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'}\`} title="Toggle Map">
          <MapPin className="w-5 h-5"/>
        </button>
      </div>

      {/* Map Panel */}
      {showMap && (
        <div className="flex-shrink-0 bg-white/80 backdrop-blur border-b border-purple-100 shadow-sm" style={{ height: '280px' }}>
          <div className="h-full p-3 flex gap-3">
            <div className="flex-1 rounded-xl overflow-hidden shadow-sm">
              ${mapSection}
            </div>
            <div className="w-36 flex flex-col gap-2">
              ${locationPanel}
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-purple-100 p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">Booking</p>
                <p className="text-gray-500 font-mono text-xs">{String(booking_id).slice(0, 12)}...</p>
                <p className="text-gray-500 mt-1 capitalize">{conversation.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Smile className="w-8 h-8 text-purple-400"/>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Say hello to get started!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-purple-200/50"/>
                <span className="text-xs text-purple-500 font-medium bg-white/60 px-3 py-1 rounded-full shadow-sm">{date}</span>
                <div className="flex-1 h-px bg-purple-200/50"/>
              </div>
              {msgs.map((msg, i) => {
                const isOwn = msg.sender_id === user.id;
                const showAvatar = !isOwn && (i === 0 || msgs[i-1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} className={\`flex \${isOwn ? 'justify-end' : 'justify-start'} mb-1\`}>
                    {!isOwn && (
                      <div className={\`w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-1 \${showAvatar ? 'bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow-sm' : 'opacity-0'}\`}>
                        {showAvatar && (otherAvatar ? <img src={otherAvatar} className="w-full h-full rounded-full object-cover" alt=""/> : otherName.charAt(0))}
                      </div>
                    )}
                    <div className={\`max-w-[72%] \${isOwn ? 'items-end' : 'items-start'} flex flex-col\`}>
                      <div className={\`px-4 py-2.5 rounded-2xl shadow-sm \${isOwn
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm'
                        : 'bg-white/90 backdrop-blur text-gray-900 rounded-bl-sm border border-purple-100'
                      } \${msg.id?.startsWith('tmp_') ? 'opacity-70' : ''}\`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <div className={\`flex items-center gap-1 mt-0.5 px-1 \${isOwn ? 'flex-row-reverse' : ''}\`}>
                        <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                        {isOwn && (
                          (msg.read || msg.is_read)
                            ? <CheckCheck className="w-3.5 h-3.5 text-blue-500"/>
                            : <Check className="w-3.5 h-3.5 text-gray-400"/>
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
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-purple-100 px-4 py-3 shadow-lg">
        {error && <p className="text-red-500 text-xs mb-2 px-1">{error}</p>}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 bg-purple-50/80 border border-purple-200 rounded-2xl px-4 py-2.5 focus-within:border-purple-400 focus-within:bg-white transition-all">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              disabled={sending}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex-shrink-0"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          </button>
        </form>
      </div>
    </div>
  );
}
`;
}

// ─── BRAIDER MESSAGES LIST ────────────────────────────────────────────────────
const braiderMsgList = `'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search, RefreshCw, Loader, Clock, CheckCircle } from 'lucide-react';

export default function BraiderMessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/conversations?user_id=' + user.id + '&role=braider');
      if (!res.ok) throw new Error('Failed to load');
      const convList = await res.json();
      if (!convList?.length) { setConversations([]); return; }

      // Enrich with customer profiles + last message
      const customerIds = [...new Set(convList.map(c => c.customer_id).filter(Boolean))];
      let profileMap = {};
      if (customerIds.length && supabase) {
        const { data: profiles } = await supabase.from('profiles').select('id,full_name,avatar_url').in('id', customerIds);
        if (profiles) profiles.forEach(p => { profileMap[p.id] = p; });
      }
      let lastMsgMap = {};
      if (supabase) {
        for (const conv of convList) {
          const { data: msgs } = await supabase.from('messages').select('content,created_at').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);
          if (msgs?.[0]) lastMsgMap[conv.id] = msgs[0];
        }
      }
      const enriched = convList.map(conv => ({
        ...conv,
        customer_name: profileMap[conv.customer_id]?.full_name || 'Customer',
        customer_avatar: profileMap[conv.customer_id]?.avatar_url,
        last_message: lastMsgMap[conv.id]?.content,
        last_message_time: lastMsgMap[conv.id]?.created_at,
      }));
      setConversations(enriched);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role === 'braider') {
      fetchConversations();
      if (!supabase) return;
      const ch = supabase.channel('braider_msgs_' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchConversations)
        .subscribe();
      return () => supabase?.removeChannel(ch);
    }
  }, [user, authLoading, fetchConversations]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#ede9f7,#dce8ff)'}}><Loader className="w-10 h-10 text-purple-600 animate-spin"/></div>;
  if (!user || user.role !== 'braider') return null;

  const filtered = conversations.filter(c => (c.customer_name||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #ede9f7 0%, #dce8ff 50%, #e8f0fe 100%)' }}>
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button onClick={fetchConversations} className="p-2 hover:bg-purple-50 rounded-xl transition-colors"><RefreshCw className="w-4 h-4 text-purple-600"/></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" placeholder="Search customers..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-purple-50/80 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"/>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 text-purple-600 animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><MessageCircle className="w-8 h-8 text-purple-400"/></div>
            <p className="text-gray-600 font-semibold">No conversations yet</p>
            <p className="text-gray-400 text-sm mt-1">Accept a booking to start chatting</p>
          </div>
        ) : filtered.map(conv => (
          <button key={conv.id} onClick={() => router.push('/braider/messages/' + conv.booking_id)}
            className="w-full bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-purple-100 p-4 hover:shadow-md hover:border-purple-300 transition-all text-left flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
              {conv.customer_avatar ? <img src={conv.customer_avatar} className="w-full h-full rounded-full object-cover" alt=""/> : (conv.customer_name||'C').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-gray-900 truncate">{conv.customer_name}</p>
                {conv.last_message_time && <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(conv.last_message_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>}
              </div>
              <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Tap to start chatting'}</p>
            </div>
            {conv.unread_count > 0 && (
              <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{conv.unread_count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
`;

// ─── CUSTOMER MESSAGES LIST ───────────────────────────────────────────────────
const customerMsgList = `'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search, RefreshCw, Loader } from 'lucide-react';

export default function CustomerMessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/conversations?user_id=' + user.id + '&role=customer');
      if (!res.ok) throw new Error('Failed to load');
      const convList = await res.json();
      if (!convList?.length) { setConversations([]); return; }

      const braiderIds = [...new Set(convList.map(c => c.braider_id).filter(Boolean))];
      let profileMap = {};
      if (braiderIds.length && supabase) {
        const { data: profiles } = await supabase.from('profiles').select('id,full_name,avatar_url').in('id', braiderIds);
        if (profiles) profiles.forEach(p => { profileMap[p.id] = p; });
      }
      let lastMsgMap = {};
      if (supabase) {
        for (const conv of convList) {
          const { data: msgs } = await supabase.from('messages').select('content,created_at').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);
          if (msgs?.[0]) lastMsgMap[conv.id] = msgs[0];
        }
      }
      const enriched = convList.map(conv => ({
        ...conv,
        braider_name: profileMap[conv.braider_id]?.full_name || 'Braider',
        braider_avatar: profileMap[conv.braider_id]?.avatar_url,
        last_message: lastMsgMap[conv.id]?.content,
        last_message_time: lastMsgMap[conv.id]?.created_at,
      }));
      setConversations(enriched);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role === 'customer') {
      fetchConversations();
      if (!supabase) return;
      const ch = supabase.channel('customer_msgs_' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchConversations)
        .subscribe();
      return () => supabase?.removeChannel(ch);
    }
  }, [user, authLoading, fetchConversations]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#ede9f7,#dce8ff)'}}><Loader className="w-10 h-10 text-purple-600 animate-spin"/></div>;
  if (!user || user.role !== 'customer') return null;

  const filtered = conversations.filter(c => (c.braider_name||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #ede9f7 0%, #dce8ff 50%, #e8f0fe 100%)' }}>
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button onClick={fetchConversations} className="p-2 hover:bg-purple-50 rounded-xl transition-colors"><RefreshCw className="w-4 h-4 text-purple-600"/></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" placeholder="Search braiders..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-purple-50/80 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"/>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 text-purple-600 animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><MessageCircle className="w-8 h-8 text-purple-400"/></div>
            <p className="text-gray-600 font-semibold">No conversations yet</p>
            <p className="text-gray-400 text-sm mt-1">Book a braider to start chatting</p>
          </div>
        ) : filtered.map(conv => (
          <button key={conv.id} onClick={() => router.push('/messages/' + conv.booking_id)}
            className="w-full bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-purple-100 p-4 hover:shadow-md hover:border-purple-300 transition-all text-left flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
              {conv.braider_avatar ? <img src={conv.braider_avatar} className="w-full h-full rounded-full object-cover" alt=""/> : (conv.braider_name||'B').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-gray-900 truncate">{conv.braider_name}</p>
                {conv.last_message_time && <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(conv.last_message_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>}
              </div>
              <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Tap to start chatting'}</p>
            </div>
            {conv.unread_count > 0 && (
              <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{conv.unread_count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
`;

// ─── WRITE ALL FILES ──────────────────────────────────────────────────────────
write('app/(braider)/braider/messages/[booking_id]/page.tsx', buildChatPage('braider'));
write('app/(customer)/messages/[booking_id]/page.tsx', buildChatPage('customer'));
write('app/(braider)/braider/messages/page.tsx', braiderMsgList);
write('app/(customer)/messages/page.tsx', customerMsgList);

console.log('\nAll message pages written!');
