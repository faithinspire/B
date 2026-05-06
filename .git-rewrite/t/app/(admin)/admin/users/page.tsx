'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    let r = users;
    if (search) { const q = search.toLowerCase(); r = r.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
    if (roleFilter !== 'all') r = r.filter(u => u.role === roleFilter);
    setFiltered(r);
  }, [search, roleFilter, users]);
  async function fetchUsers() {
    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not authenticated'); setLoading(false); return; }
      const res = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + session.access_token } });
      if (!res.ok) { const b = await res.json(); setError(b.error || 'Failed'); setLoading(false); return; }
      const data = await res.json();
      setUsers(data); setFiltered(data);
    } catch(e) { setError('Failed to load users'); }
    finally { setLoading(false); }
  }
  const badge = (role) => {
    const c = { admin:'bg-purple-100 text-purple-800', braider:'bg-blue-100 text-blue-800', customer:'bg-green-100 text-green-800' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c[role]||'bg-gray-100 text-gray-700'}`}>{role}</span>;
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
                <tr><th className="text-left px-4 py-3 font-medium text-gray-600">Name</th><th className="text-left px-4 py-3 font-medium text-gray-600">Email</th><th className="text-left px-4 py-3 font-medium text-gray-600">Role</th><th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th><th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u=>(
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">{badge(u.role)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </div>
    </div>
  );
}
