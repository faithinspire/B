'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Bell, Trash2, CheckCircle, Loader, MessageCircle, Calendar, Star, AlertCircle } from 'lucide-react';

const ICONS = {
  message: MessageCircle,
  booking: Calendar,
  review: Star,
  payment: CheckCircle,
  sos: AlertCircle,
  default: Bell,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
  }, [user, authLoading, router]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?userId=' + user.id);
      if (res.ok) { const data = await res.json(); setNotifications(Array.isArray(data) ? data : []); }
      else setNotifications([]);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) fetchNotifications(); }, [user, fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !supabase) return;
    const ch = supabase.channel('notif_' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id },
        p => { if (p.new) setNotifications(prev => [p.new, ...prev]); })
      .subscribe();
    return () => supabase?.removeChannel(ch);
  }, [user]);

  const markRead = async (id) => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: id, read: true }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markRead(n.id)));
  };

  const deleteNotif = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Best-effort delete
    try { await fetch('/api/notifications?id=' + id, { method: 'DELETE' }); } catch {}
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  };

  if (authLoading || (!user && loading)) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Loader className="w-12 h-12 text-primary-600 animate-spin"/>
    </div>
  );
  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-1">Notifications</h1>
            <p className="text-primary-100 text-sm">{unreadCount > 0 ? unreadCount + ' unread' : 'All caught up'}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4"/> Mark all read
            </button>
          )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 text-primary-600 animate-spin"/></div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
            <p className="text-gray-600 text-lg font-semibold">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-2">You'll see booking updates, messages, and more here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, idx) => {
              const Icon = ICONS[n.type] || ICONS.default;
              return (
                <div key={n.id} onClick={()=>!n.read&&markRead(n.id)}
                  className={`rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all ${n.read?'bg-white border border-gray-200':'bg-primary-50 border-2 border-primary-200 shadow-sm'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.read?'bg-gray-100':'bg-primary-100'}`}>
                    <Icon className={`w-5 h-5 ${n.read?'text-gray-500':'text-primary-600'}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0"/>}
                    </div>
                    <p className="text-gray-600 text-sm">{n.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteNotif(n.id);}} className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500"/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
