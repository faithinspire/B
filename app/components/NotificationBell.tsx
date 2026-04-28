'use client';
// Real-time notification bell — shows booking + message notifications
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Calendar, MessageCircle, Star, AlertCircle } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  booking_id?: string;
  data?: any;
  created_at: string;
}

const TYPE_ICON: Record<string, { icon: any; color: string; bg: string }> = {
  booking:         { icon: Calendar,       color: 'text-purple-600', bg: 'bg-purple-100' },
  booking_accepted:{ icon: Calendar,       color: 'text-green-600',  bg: 'bg-green-100'  },
  booking_rejected:{ icon: AlertCircle,    color: 'text-red-600',    bg: 'bg-red-100'    },
  message:         { icon: MessageCircle,  color: 'text-blue-600',   bg: 'bg-blue-100'   },
  review:          { icon: Star,           color: 'text-yellow-600', bg: 'bg-yellow-100' },
  default:         { icon: Bell,           color: 'text-gray-600',   bg: 'bg-gray-100'   },
};

export function NotificationBell() {
  const { user } = useSupabaseAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Real-time subscription
    if (!supabase) return;
    const ch = supabase
      .channel(`notifs_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        // Browser notification if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
        }
      })
      .subscribe();

    return () => { supabase?.removeChannel(ch); };
  }, [user, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, read: true }),
      });
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await Promise.all(unread.map(n => markRead(n.id)));
  };

  const handleNotifClick = async (n: Notification) => {
    await markRead(n.id);
    setOpen(false);

    // Navigate based on type
    if (n.booking_id) {
      if (user?.role === 'braider') {
        router.push(`/braider/bookings`);
      } else {
        router.push(`/messages/${n.booking_id}`);
      }
    } else if (n.type === 'message') {
      if (user?.role === 'braider') {
        router.push('/braider/messages');
      } else {
        router.push('/messages');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">We'll notify you about bookings and messages</p>
              </div>
            ) : (
              notifications.map(n => {
                const typeInfo = TYPE_ICON[n.type] || TYPE_ICON.default;
                const Icon = typeInfo.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${!n.read ? 'bg-purple-50/50' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-full ${typeInfo.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {n.title}
                        </p>
                        {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button
                onClick={() => { setOpen(false); router.push('/notifications'); }}
                className="w-full text-center text-xs text-purple-600 hover:text-purple-700 font-semibold py-1"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
