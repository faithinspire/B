'use client';
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
