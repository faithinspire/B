'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft } from 'lucide-react';
import { CustomerLocationMap } from '@/app/components/CustomerLocationMap';

export default function CustomerChatPage() {
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
  const [showMap, setShowMap] = useState(true);
  const [braiderLocation, setBraiderLocation] = useState(null);
  const messagesEndRef = useRef(null);

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
      let conv = Array.isArray(convList) ? convList.find(c => c.booking_id === booking_id) : null;
      if (!conv) throw new Error('No conversation found. The braider may not have accepted yet.');
      if (conv.braider_id && supabase) {
        const { data: p } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', conv.braider_id).single();
        if (p) { conv = { ...conv, braider_name: p.full_name, braider_avatar: p.avatar_url }; }
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
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [user, booking_id]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  useEffect(() => {
    if (!conversation || !supabase) return;
    const ch = supabase
      .channel('cc_' + conversation.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + conversation.id,
      }, p => {
        const m = p.new;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    const li = setInterval(async () => {
      if (!conversation?.braider_id) return;
      try {
        const r = await fetch('/api/location/braider/' + conversation.braider_id + '?booking_id=' + booking_id);
        if (r.ok) { const d = await r.json(); if (d?.latitude) setBraiderLocation(d); }
      } catch {}
    }, 15000);
    return () => { supabase?.removeChannel(ch); clearInterval(li); };
  }, [conversation, booking_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_role: 'customer',
          content: newMessage.trim(),
          message_type: 'text',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setNewMessage('');
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="w-10 h-10 text-primary-600 animate-spin"/></div>;
  }
  if (!user || user.role !== 'customer') return null;

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-2">{error || 'No conversation found'}</p>
          <p className="text-gray-500 text-sm mb-4">The braider needs to accept your booking first.</p>
          <button onClick={() => router.push('/messages')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Back to Messages</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/messages')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5 text-gray-600"/>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
          {(conversation.braider_name || 'B').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{conversation.braider_name || 'Braider'}</p>
          <p className="text-xs text-gray-500">Booking: {String(booking_id).slice(0, 8)}...</p>
        </div>
        <button onClick={() => setShowMap(v => !v)} className={`p-2 rounded-lg ${showMap ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 text-gray-500'}`}>
          <MapPin className="w-5 h-5"/>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow" style={{ height: '70vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0
              ? <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-sm">No messages yet. Say hello!</p></div>
              : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.sender_id === user.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p>{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-60 justify-end">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.sender_id === user.id && (msg.read ? <CheckCheck className="w-3 h-3"/> : <Check className="w-3 h-3"/>)}
                    </div>
                  </div>
                </div>
              ))
            }
            <div ref={messagesEndRef}/>
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100">
            {error && <p className="text-red-600 text-xs mb-2 px-1">{error}</p>}
            <div className="flex gap-2">
              <input
                type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                disabled={sending}
              />
              <button type="submit" disabled={sending || !newMessage.trim()} className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50">
                <Send className="w-4 h-4"/>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-4">
          {showMap && (
            <div className="bg-white rounded-xl shadow p-3" style={{ height: '320px' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Braider Location</p>
              <div className="h-64">
                <CustomerLocationMap braiderLocation={braiderLocation}/>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow p-4 text-sm">
            <h3 className="font-semibold text-gray-900 mb-1">Booking Info</h3>
            <p className="text-gray-500 text-xs">Status: <span className="capitalize text-gray-700">{conversation.status}</span></p>
            <p className={`text-xs mt-1 ${braiderLocation ? 'text-green-600' : 'text-gray-400'}`}>
              {braiderLocation ? '● Braider is sharing location' : 'Location not available yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
