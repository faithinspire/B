import { writeFileSync } from 'fs';
import { resolve } from 'path';
const root = process.cwd();

// ─── BRAIDER CHAT PAGE ────────────────────────────────────────────────────────
const braiderChat = `'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, MapPin, CheckCheck, Check, Loader, ArrowLeft } from 'lucide-react';
import { BraiderLocationMap } from '@/app/components/BraiderLocationMap';
import { useBraiderLocationTracking } from '@/app/hooks/useBraiderLocationTracking';

export default function BraiderChatPage() {
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
  const messagesEndRef = useRef(null);
  const { isTracking, startTracking, stopTracking } = useBraiderLocationTracking(booking_id);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !booking_id) return;
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/conversations?user_id=' + user.id + '&role=braider');
      if (!res.ok) throw new Error('Failed to load conversations');
      const convList = await res.json();
      let conv = Array.isArray(convList) ? convList.find(c => c.booking_id === booking_id) : null;
      if (!conv) throw new Error('No conversation found. Accept the booking first.');
      if (conv.customer_id && supabase) {
        const { data: p } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', conv.customer_id).single();
        if (p) { conv = { ...conv, customer_name: p.full_name, customer_avatar: p.avatar_url }; }
      }
      setConversation(conv);
      const msgRes = await fetch('/api/messages/conversation/' + conv.id + '?user_id=' + user.id + '&limit=100');
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d?.messages || (Array.isArray(d) ? d : []));
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
      .channel('bc_' + conversation.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + conversation.id,
      }, p => {
        const m = p.new;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => supabase?.removeChannel(ch);
  }, [conversation]);

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
          sender_role: 'braider',
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
  if (!user || user.role !== 'braider') return null;

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-2">{error || 'No conversation found'}</p>
          <p className="text-gray-500 text-sm mb-4">Accept the booking first to start chatting.</p>
          <button onClick={() => router.push('/braider/bookings')} className="px-4 py-2 bg-primary-600 text-white rounded-lg mr-2">View Bookings</button>
          <button onClick={() => router.push('/braider/messages')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/braider/messages')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5 text-gray-600"/>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
          {(conversation.customer_name || 'C').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{conversation.customer_name || 'Customer'}</p>
          <p className="text-xs text-gray-500">Booking: {String(booking_id).slice(0, 8)}...</p>
        </div>
        <button onClick={() => setShowMap(v => !v)} className={\`p-2 rounded-lg \${showMap ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 text-gray-500'}\`}>
          <MapPin className="w-5 h-5"/>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow" style={{ height: '70vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0
              ? <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-sm">No messages yet. Say hello!</p></div>
              : messages.map(msg => (
                <div key={msg.id} className={\`flex \${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}\`}>
                  <div className={\`max-w-xs px-4 py-2 rounded-2xl text-sm \${msg.sender_id === user.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}\`}>
                    <p>{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-60 justify-end">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.sender_id === user.id && ((msg.read || msg.is_read) ? <CheckCheck className="w-3 h-3"/> : <Check className="w-3 h-3"/>)}
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
            <div className="bg-white rounded-xl shadow p-3" style={{ height: '280px' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Customer Location</p>
              <div className="h-56"><BraiderLocationMap booking_id={booking_id}/></div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Share Your Location</h3>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={\`w-full px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 \${isTracking ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'}\`}
            >
              <MapPin className="w-4 h-4"/>
              {isTracking ? 'Stop Sharing' : 'Share Location'}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {isTracking ? 'Customer can see your location' : 'Let customer track your arrival'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-sm">
            <h3 className="font-semibold text-gray-900 mb-1">Booking Info</h3>
            <p className="text-gray-500 text-xs">ID: <span className="font-mono">{String(booking_id).slice(0, 12)}...</span></p>
            <p className="text-gray-500 text-xs mt-1">Status: <span className="capitalize text-gray-700">{conversation.status}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── ADMIN USERS PAGE ────────────────────────────────────────────────────────
const adminUsers = `'use client';
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

  function chatWithUser(u) {
    router.push('/admin/conversations?user=' + u.id + '&name=' + encodeURIComponent(u.full_name || u.email));
  }

  const roleCls = (role) => role==='admin'?'bg-purple-100 text-purple-800':role==='braider'?'bg-blue-100 text-blue-800':'bg-green-100 text-green-800';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} user{filtered.length!==1?'s':''}</p>
          </div>
          <button onClick={fetchUsers} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Refresh</button>
        </div>
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="Search name or email..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="braider">Braider</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading
            ? <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading users...</div>
            : filtered.length===0
              ? <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No users found</div>
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
                        <td className="px-4 py-3">
                          <span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${roleCls(u.role)}\`}>{u.role}</span>
                        </td>
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
                </table>
          }
        </div>
      </div>

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
              <button onClick={()=>setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Role</span>
                <span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${roleCls(selected.role)}\`}>{selected.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone</span><span className="text-gray-900">{selected.phone||'—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Joined</span><span className="text-gray-900">{new Date(selected.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">User ID</span><span className="text-gray-900 font-mono text-xs break-all">{selected.id}</span>
              </div>
              {profileLoading && <p className="text-gray-400 text-xs py-2">Loading profile details...</p>}
              {profile && <>
                {profile.bio && <div className="py-2 border-b border-gray-100"><p className="text-gray-500 mb-1">Bio</p><p className="text-gray-900">{profile.bio}</p></div>}
                {profile.location && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Location</span><span className="text-gray-900">{profile.location}</span></div>}
                {profile.rating && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Rating</span><span className="text-gray-900">{profile.rating} ★</span></div>}
                {profile.total_bookings !== undefined && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Total Bookings</span><span className="text-gray-900">{profile.total_bookings}</span></div>}
                {profile.is_verified !== undefined && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Verified</span><span className={\`font-medium \${profile.is_verified?'text-green-600':'text-gray-400'}\`}>{profile.is_verified?'Yes':'No'}</span></div>}
              </>}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={()=>chatWithUser(selected)} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Chat with User</button>
              <button onClick={()=>setSelected(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// ─── CUSTOMER CHAT PAGE ───────────────────────────────────────────────────────
const customerChat = `'use client';
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
        <button onClick={() => setShowMap(v => !v)} className={\`p-2 rounded-lg \${showMap ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 text-gray-500'}\`}>
          <MapPin className="w-5 h-5"/>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow" style={{ height: '70vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0
              ? <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-sm">No messages yet. Say hello!</p></div>
              : messages.map(msg => (
                <div key={msg.id} className={\`flex \${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}\`}>
                  <div className={\`max-w-xs px-4 py-2 rounded-2xl text-sm \${msg.sender_id === user.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}\`}>
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
            <p className={\`text-xs mt-1 \${braiderLocation ? 'text-green-600' : 'text-gray-400'}\`}>
              {braiderLocation ? '● Braider is sharing location' : 'Location not available yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── WRITE FILES ─────────────────────────────────────────────────────────────
const files = [
  {
    path: 'app/(braider)/braider/messages/[booking_id]/page.tsx',
    content: braiderChat,
  },
  {
    path: 'app/(customer)/messages/[booking_id]/page.tsx',
    content: customerChat,
  },
  {
    path: 'app/(admin)/admin/users/page.tsx',
    content: adminUsers,
  },
];

let ok = 0;
for (const f of files) {
  try {
    const full = resolve(root, f.path);
    writeFileSync(full, f.content, 'utf8');
    console.log('✅ Written:', f.path);
    ok++;
  } catch (e) {
    console.error('❌ Failed:', f.path, e.message);
  }
}
console.log(`\nDone: ${ok}/${files.length} files written.`);
