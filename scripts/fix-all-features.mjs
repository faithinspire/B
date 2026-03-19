import { writeFileSync } from 'fs';
import { resolve } from 'path';
const root = process.cwd();

// ─── ADMIN USERS PAGE (with detail modal + chat initiation) ───────────────────
const adminUsersPage = `'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    let r = users;
    if (search) { const q = search.toLowerCase(); r = r.filter(u => (u.full_name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q)); }
    if (roleFilter !== 'all') r = r.filter(u => u.role === roleFilter);
    setFiltered(r);
  }, [search, roleFilter, users]);

  async function fetchUsers() {
    setLoading(true); setError('');
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setError('Not authenticated'); setLoading(false); return; }
      const res = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + session.access_token } });
      if (!res.ok) { const b = await res.json(); setError(b.error || 'Failed'); setLoading(false); return; }
      const data = await res.json();
      setUsers(data); setFiltered(data);
    } catch(e) { setError('Failed to load users'); }
    finally { setLoading(false); }
  }

  async function openUser(u) {
    setSelected(u); setProfile(null); setProfileLoading(true);
    try {
      const { data } = await sb.from('profiles').select('*').eq('id', u.id).single();
      setProfile(data);
    } catch {}
    finally { setProfileLoading(false); }
  }

  async function chatWithUser(u) {
    // Find or create a direct conversation between admin and this user
    // Navigate to admin conversations page with a query
    router.push('/admin/conversations?user=' + u.id + '&name=' + encodeURIComponent(u.full_name));
  }

  const badge = (role) => {
    const c = { admin:'bg-purple-100 text-purple-800', braider:'bg-blue-100 text-blue-800', customer:'bg-green-100 text-green-800' };
    return <span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${c[role]||'bg-gray-100 text-gray-700'}\`}>{role}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Users</h1><p className="text-sm text-gray-500 mt-1">{filtered.length} user{filtered.length!==1?'s':''}</p></div>
          <button onClick={fetchUsers} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Refresh</button>
        </div>
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="Search name or email..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Roles</option><option value="customer">Customer</option><option value="braider">Braider</option><option value="admin">Admin</option>
          </select>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading users...</div>
          : filtered.length===0 ? <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No users found</div>
          : <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u=>(
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name||'—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">{badge(u.role)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone||'—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={()=>openUser(u)} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100">View</button>
                        <button onClick={()=>chatWithUser(u)} className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100">Chat</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                  {(selected.full_name||selected.email||'?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.full_name||'Unknown'}</h2>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Role</span><span>{badge(selected.role)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone</span><span className="text-gray-900">{selected.phone||'—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Joined</span><span className="text-gray-900">{new Date(selected.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">User ID</span><span className="text-gray-900 font-mono text-xs">{selected.id}</span>
              </div>
              {profileLoading && <p className="text-gray-400 text-xs">Loading profile...</p>}
              {profile && (
                <>
                  {profile.bio && <div className="py-2 border-b border-gray-100"><p className="text-gray-500 mb-1">Bio</p><p className="text-gray-900">{profile.bio}</p></div>}
                  {profile.location && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Location</span><span className="text-gray-900">{profile.location}</span></div>}
                  {profile.rating && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Rating</span><span className="text-gray-900">{profile.rating} ★</span></div>}
                  {profile.total_bookings !== undefined && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Total Bookings</span><span className="text-gray-900">{profile.total_bookings}</span></div>}
                  {profile.is_verified !== undefined && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Verified</span><span className={\`font-medium \${profile.is_verified?'text-green-600':'text-gray-400'}\`}>{profile.is_verified?'Yes':'No'}</span></div>}
                </>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={()=>chatWithUser(selected)} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                Chat with User
              </button>
              <button onClick={()=>setSelected(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// ─── BOOKING PAGE (with bypass payment) ──────────────────────────────────────
const bookingPage = `'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, AlertCircle, Loader, CheckCircle } from 'lucide-react';

function PaymentForm({ bookingId, amount, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [bypassMode, setBypassMode] = useState(false);
  const stripeRef = useRef(null);
  const cardRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const key = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();
        if (!key || key.length < 10 || !key.startsWith('pk_')) {
          if (!cancelled) { setBypassMode(true); setStripeReady(true); }
          return;
        }
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(key);
        if (cancelled || !stripe) { setBypassMode(true); setStripeReady(true); return; }
        stripeRef.current = stripe;
        const elements = stripe.elements();
        const card = elements.create('card', {
          style: { base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9ca3af' } }, invalid: { color: '#ef4444' } },
        });
        cardRef.current = card;
        setTimeout(() => {
          if (!cancelled && document.getElementById('card-element')) {
            card.mount('#card-element');
            mountedRef.current = true;
            setStripeReady(true);
          }
        }, 150);
      } catch {
        if (!cancelled) { setBypassMode(true); setStripeReady(true); }
      }
    }
    init();
    return () => {
      cancelled = true;
      if (cardRef.current && mountedRef.current) { try { cardRef.current.unmount(); } catch {} mountedRef.current = false; }
    };
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create payment'); }
      const { clientSecret, bypassMode: isBypass } = await res.json();
      if (isBypass || (clientSecret && clientSecret.startsWith('bypass_'))) {
        // Bypass: mark booking confirmed directly
        await fetch('/api/bookings/' + bookingId + '/confirm', { method: 'POST' }).catch(() => {});
        onSuccess(); return;
      }
      if (!stripeRef.current || !cardRef.current) throw new Error('Payment form not ready');
      const result = await stripeRef.current.confirmCardPayment(clientSecret, { payment_method: { card: cardRef.current } });
      if (result.error) setError(result.error.message || 'Payment failed');
      else if (result.paymentIntent?.status === 'succeeded') onSuccess();
      else setError('Payment failed. Please try again.');
    } catch (err) { setError(err.message || 'Payment failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      {!bypassMode && (
        <div className="p-4 border border-gray-300 rounded-lg bg-white min-h-[50px]">
          {!stripeReady && <div className="text-sm text-gray-400">Loading payment form...</div>}
          <div id="card-element" />
        </div>
      )}
      {bypassMode && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          Demo payment mode — click Pay to confirm your booking instantly.
        </div>
      )}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm font-medium">{error}</p></div>}
      <button type="submit" disabled={!stripeReady || loading}
        className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold">
        {loading ? 'Processing...' : 'Pay $' + (amount||0).toFixed(2)}
      </button>
    </form>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => { if (params?.id) fetchBooking(); }, [params?.id]);

  const fetchBooking = async () => {
    if (!params?.id) return;
    try {
      const res = await fetch('/api/bookings/' + params.id);
      if (!res.ok) { setLoading(false); return; }
      setBooking(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-12 h-12 text-primary-600 animate-spin"/></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4"/><p className="text-gray-600 font-semibold">Booking not found</p></div></div>;

  const statusColor = { confirmed:'bg-blue-100 text-blue-700', completed:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700', accepted:'bg-green-100 text-green-700' };
  const isPending = booking.status === 'pending' || booking.status === 'pending_payment';
  const isAccepted = booking.status === 'confirmed' || booking.status === 'accepted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={()=>router.back()} className="mb-6 text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2">← Back</button>
        <h1 className="text-3xl font-serif font-bold mb-8">Booking Details</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Status</h2>
                <span className={\`px-4 py-2 rounded-full font-medium \${statusColor[booking.status]||'bg-gray-100 text-gray-700'}\`}>{booking.status?.charAt(0).toUpperCase()+booking.status?.slice(1)}</span>
              </div>
              {isPending && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3"><AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"/><p className="text-sm text-yellow-700">Complete payment to confirm your booking.</p></div>}
              {isAccepted && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/><div className="flex-1"><p className="text-sm text-blue-700">Your booking is confirmed.</p><button onClick={()=>router.push('/messages/'+booking.id)} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm">Chat with Braider</button></div></div>}
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Service Details</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-gray-600">Service</span><span className="font-medium">{booking.service_name||'—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Braider</span><span className="font-medium">{booking.braider_name||'—'}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Appointment</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><Calendar className="w-5 h-5 text-gray-400 mt-0.5"/><div><p className="text-gray-600 text-sm">Date & Time</p><p className="font-medium">{booking.appointment_date?new Date(booking.appointment_date).toLocaleString():'TBD'}</p></div></div>
                <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-gray-400 mt-0.5"/><div><p className="text-gray-600 text-sm">Location</p><p className="font-medium">{booking.location_address||'TBD'}</p></div></div>
              </div>
            </div>
            {booking.notes && <div className="bg-white rounded-2xl shadow-sm p-6"><h2 className="text-xl font-semibold mb-4">Notes</h2><p className="text-gray-700">{booking.notes}</p></div>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 h-fit">
            <h2 className="text-xl font-semibold mb-6">Payment Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between"><span className="text-gray-600">Service</span><span className="font-medium">\${(booking.service_price||0).toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">Platform Fee</span><span className="font-medium">\${(booking.platform_fee||0).toFixed(2)}</span></div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between"><span className="font-semibold">Total</span><span className="text-2xl font-bold text-primary-600">\${(booking.total_amount||0).toFixed(2)}</span></div>
            </div>
            {isPending && !paymentComplete && (
              <PaymentForm bookingId={booking.id} amount={booking.total_amount||0} onSuccess={()=>{ setPaymentComplete(true); setBooking({...booking,status:'confirmed'}); }}/>
            )}
            {paymentComplete && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2"/>
                <p className="text-green-700 font-semibold">Payment Successful!</p>
                <button onClick={()=>router.push('/messages/'+booking.id)} className="mt-3 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm">Chat with Braider →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── NOTIFICATIONS PAGE (real data for all roles) ────────────────────────────
const notificationsPage = `'use client';
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
                  className={\`rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all \${n.read?'bg-white border border-gray-200':'bg-primary-50 border-2 border-primary-200 shadow-sm'}\`}>
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 \${n.read?'bg-gray-100':'bg-primary-100'}\`}>
                    <Icon className={\`w-5 h-5 \${n.read?'text-gray-500':'text-primary-600'}\`}/>
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
`;

// ─── WRITE ALL FILES ──────────────────────────────────────────────────────────
const files = [
  { path: resolve(root, 'app/(admin)/admin/users/page.tsx'), content: adminUsersPage },
  { path: resolve(root, 'app/(customer)/booking/[id]/page.tsx'), content: bookingPage },
  { path: resolve(root, 'app/(customer)/notifications/page.tsx'), content: notificationsPage },
];

for (const f of files) {
  writeFileSync(f.path, f.content, 'utf8');
  console.log('Written:', f.path);
}
console.log('Done.');
