'use client';
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleCls(u.role)}`}>{u.role}</span>
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleCls(selected.role)}`}>{selected.role}</span>
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
                {profile.is_verified !== undefined && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Verified</span><span className={`font-medium ${profile.is_verified?'text-green-600':'text-gray-400'}`}>{profile.is_verified?'Yes':'No'}</span></div>}
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
