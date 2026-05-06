'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Search, RefreshCw, Loader, ChevronRight } from 'lucide-react';

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface Conv {
  id: string;
  booking_id?: string | null;
  braider_id?: string | null;
  customer_id?: string | null;
  participant1_id?: string | null;
  participant2_id?: string | null;
  other_name: string;
  other_avatar: string | null;
  last_message: string;
  last_time: string | null;
  unread: number;
}

export default function CustomerMessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) router.push('/login');
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDb();
      // Fetch conversations — try both schemas
      const { data: rows } = await db.from('conversations').select('*')
        .or(`customer_id.eq.${user.id},participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (!rows?.length) { setConvs([]); return; }

      const enriched: Conv[] = await Promise.all(rows.map(async (row: any) => {
        const braiderId = row.braider_id || (row.participant1_id === user.id ? row.participant2_id : row.participant1_id);
        let other_name = 'Braider', other_avatar = null;
        if (braiderId) {
          const { data: p } = await db.from('profiles').select('full_name,avatar_url').eq('id', braiderId).single();
          if (p) { other_name = p.full_name || 'Braider'; other_avatar = p.avatar_url; }
        }
        // Last message
        const { data: msgs } = await db.from('messages').select('content,created_at,read,sender_id')
          .eq('conversation_id', row.id).order('created_at', { ascending: false }).limit(1);
        const last = msgs?.[0];
        // Unread count
        const { count } = await db.from('messages').select('*', { count: 'exact', head: true })
          .eq('conversation_id', row.id).eq('sender_id', braiderId || '').eq('read', false);
        return {
          id: row.id,
          booking_id: row.booking_id,
          braider_id: braiderId,
          customer_id: row.customer_id || row.participant1_id,
          other_name,
          other_avatar,
          last_message: last?.content || 'Tap to chat',
          last_time: last?.created_at || null,
          unread: count || 0,
        };
      }));
      setConvs(enriched);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role === 'customer') load();
  }, [user, authLoading, load]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader className="w-8 h-8 text-purple-600 animate-spin"/></div>;
  if (!user || user.role !== 'customer') return null;

  const filtered = convs.filter(c => c.other_name.toLowerCase().includes(search.toLowerCase()));
  const navTo = (c: Conv) => router.push('/messages/' + (c.booking_id || c.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button onClick={load} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-5 h-5 text-gray-500"/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"/>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader className="w-8 h-8 text-purple-500 animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-purple-500"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No messages yet</h3>
            <p className="text-gray-500 text-sm">Book a braider to start chatting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(c => (
              <button key={c.id} onClick={() => navTo(c)} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-sm">
                    {c.other_avatar ? <img src={c.other_avatar} className="w-full h-full object-cover" alt=""/> : c.other_name.charAt(0).toUpperCase()}
                  </div>
                  {c.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{c.unread}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={c.unread > 0 ? 'font-bold text-gray-900 truncate' : 'font-semibold text-gray-800 truncate'}>{c.other_name}</p>
                    {c.last_time && <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(c.last_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>}
                  </div>
                  <p className={c.unread > 0 ? 'text-sm text-gray-900 truncate font-medium' : 'text-sm text-gray-500 truncate'}>{c.last_message}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
