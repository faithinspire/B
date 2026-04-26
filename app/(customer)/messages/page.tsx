'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { MessageCircle, Search, RefreshCw, Loader, ChevronRight, Plus } from 'lucide-react';

interface Conv {
  id: string;
  booking_id?: string | null;
  braider_id?: string | null;
  customer_id?: string | null;
  other_name: string;
  other_avatar: string | null;
  last_message: string;
  last_time: string | null;
  unread: number;
}

export default function CustomerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) router.push('/login');
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?user_id=${user.id}&role=customer`);
      let rows: any[] = [];
      if (res.ok) {
        const data = await res.json();
        rows = Array.isArray(data) ? data : (data.conversations || []);
      }
      if (!rows.length) { setConvs([]); return; }

      const enriched: Conv[] = await Promise.all(rows.map(async (row: any) => {
        let other_name = row.other_user?.full_name || 'Braider';
        let other_avatar = row.other_user?.avatar_url || null;
        const braiderId = row.braider_id || row.participant2_id;
        if (braiderId && !row.other_user) {
          try {
            const profileRes = await fetch(`/api/braiders/${braiderId}`);
            if (profileRes.ok) {
              const profile = await profileRes.json();
              other_name = profile.full_name || 'Braider';
              other_avatar = profile.avatar_url || null;
            }
          } catch {}
        }
        return {
          id: row.id,
          booking_id: row.booking_id,
          braider_id: braiderId,
          customer_id: row.customer_id || row.participant1_id,
          other_name,
          other_avatar,
          last_message: row.last_message?.content || 'Tap to chat',
          last_time: row.last_message?.created_at || row.updated_at || null,
          unread: row.unread_count || 0,
        };
      }));
      setConvs(enriched);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConvs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle direct message from braider profile page (?braider_id=xxx)
  useEffect(() => {
    const braiderId = searchParams?.get('braider_id');
    if (!braiderId || !user || authLoading) return;

    const startDirectChat = async () => {
      setStarting(true);
      try {
        // Check if conversation already exists
        const res = await fetch(`/api/conversations?user_id=${user.id}&role=customer`);
        if (res.ok) {
          const data = await res.json();
          const rows = Array.isArray(data) ? data : [];
          const existing = rows.find((r: any) => r.braider_id === braiderId || r.participant2_id === braiderId);
          if (existing) {
            if (existing.booking_id) {
              router.push('/messages/' + existing.booking_id);
            } else {
              router.push('/messages/conv/' + existing.id);
            }
            return;
          }
        }

        // Create new conversation
        const createRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: user.id,
            braider_id: braiderId,
            booking_id: null,
          }),
        });

        if (createRes.ok) {
          const conv = await createRes.json();
          if (conv.booking_id) {
            router.push('/messages/' + conv.booking_id);
          } else {
            router.push('/messages/conv/' + conv.id);
          }
        } else {
          await load();
        }
      } catch (err) {
        console.error('Error starting chat:', err);
        await load();
      } finally {
        setStarting(false);
      }
    };

    startDirectChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.id, authLoading]);

  useEffect(() => {
    if (!authLoading && user?.role === 'customer') load();
  }, [user, authLoading, load]);

  if (authLoading || starting) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2"/>
        {starting && <p className="text-sm text-gray-500">Starting chat...</p>}
      </div>
    </div>
  );
  if (!user || user.role !== 'customer') return null;

  const filtered = convs.filter(c => c.other_name.toLowerCase().includes(search.toLowerCase()));
  const navTo = (c: Conv) => {
    if (c.booking_id) {
      router.push('/messages/' + c.booking_id);
    } else {
      router.push('/messages/conv/' + c.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <div className="flex gap-2">
              <button onClick={() => router.push('/search')} className="p-2 rounded-full hover:bg-purple-100 transition-colors" title="Find braiders to chat with">
                <Plus className="w-5 h-5 text-purple-600"/>
              </button>
              <button onClick={load} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-500"/>
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
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
            <p className="text-gray-500 text-sm mb-4">Find a braider or barber to start chatting</p>
            <button onClick={() => router.push('/search')} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors">
              Find Professionals →
            </button>
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
