import { writeFileSync } from 'fs';

// Force write admin users page with delete functionality
const adminUsersPage = `'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let r = [...users];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(u => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') r = r.filter(u => u.role === roleFilter);
    setFiltered(r);
  }, [search, roleFilter, users]);

  async function fetchUsers() {
    setLoading(true); setError('');
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setError('Not authenticated'); setLoading(false); return; }
      const res = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + session.access_token } });
      if (!res.ok) { const b = await res.json(); setError(b.error || 'Failed to load'); setLoading(false); return; }
      const data = await res.json();
      setUsers(data); setFiltered(data);
    } catch { setError('Failed to load users'); }
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

  async function deleteUser(u) {
    setDeleting(u.id);
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/users/' + u.id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + session.access_token },
      });
      if (!res.ok) { const b = await res.json(); setError(b.error || 'Failed to delete'); return; }
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setConfirmDelete(null);
      if (selected && selected.id === u.id) setSelected(null);
    } catch { setError('Failed to delete user'); }
    finally { setDeleting(null); }
  }

  function chatWithUser(u) {
    router.push('/admin/conversations?user=' + u.id + '&name=' + encodeURIComponent(u.full_name || u.email || 'User'));
  }

  const roleCls = r =>
    r === 'admin' ? 'bg-purple-100 text-purple-800' :
    r === 'braider' ? 'bg-blue-100 text-blue-800' :
    'bg-green-100 text-green-800';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-xs text-gray-500 mt-0.5">{filtered.length} user{filtered.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={fetchUsers} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-medium">Refresh</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="braider">Braider</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading
            ? <div className="flex items-center justify-center py-20 text-gray-400 text-sm"><div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mr-3" />Loading users...</div>
            : filtered.length === 0
              ? <div className="flex items-center justify-center py-20 text-gray-400 text-sm">No users found</div>
              : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">User</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Role</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Phone</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Joined</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{u.full_name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3"><span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${roleCls(u.role)}\`}>{u.role}</span></td>
                          <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => openUser(u)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors">View</button>
                              <button onClick={() => chatWithUser(u)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">Chat</button>
                              {u.role !== 'admin' && (
                                <button onClick={() => setConfirmDelete(u)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          }
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-600 mb-1">This will permanently delete:</p>
            <p className="text-sm font-semibold text-gray-900 mb-4">{confirmDelete.full_name || confirmDelete.email}</p>
            <p className="text-xs text-red-600 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteUser(confirmDelete)} disabled={deleting === confirmDelete.id}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting === confirmDelete.id ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {(selected.full_name || selected.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.full_name || 'Unknown'}</h2>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <span className={\`text-xs px-2 py-0.5 rounded-full font-medium \${roleCls(selected.role)}\`}>{selected.role}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full text-lg font-bold">x</button>
            </div>
            <div className="space-y-0 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between py-3"><span className="text-gray-500">Phone</span><span className="text-gray-900 font-medium">{selected.phone || '—'}</span></div>
              <div className="flex justify-between py-3"><span className="text-gray-500">Joined</span><span className="text-gray-900">{new Date(selected.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
              <div className="py-3"><span className="text-gray-500 block mb-1">User ID</span><span className="text-gray-900 font-mono text-xs break-all">{selected.id}</span></div>
              {profileLoading && <div className="py-3 text-gray-400 text-xs">Loading profile...</div>}
              {profile && <>
                {profile.bio && <div className="py-3"><span className="text-gray-500 block mb-1">Bio</span><p className="text-gray-900">{profile.bio}</p></div>}
                {profile.location && <div className="flex justify-between py-3"><span className="text-gray-500">Location</span><span className="text-gray-900">{profile.location}</span></div>}
              </>}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => chatWithUser(selected)} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Chat with User</button>
              {selected.role !== 'admin' && (
                <button onClick={() => { setSelected(null); setConfirmDelete(selected); }} className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
              )}
              <button onClick={() => setSelected(null)} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// Force write delete API route
const deleteRoute = `import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.substring(7);
    const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', adminUser.id).single();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) return NextResponse.json({ error: deleteError.message || 'Failed to delete user' }, { status: 500 });

    await Promise.allSettled([
      supabaseAdmin.from('profiles').delete().eq('id', userId),
      supabaseAdmin.from('braider_profiles').delete().eq('user_id', userId),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;

// Force write review modal
const reviewModal = `'use client';
import { useState } from 'react';
import { Star, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewSubmissionModalProps {
  bookingId: string;
  braiderId: string;
  braiderName: string;
  reviewerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewSubmissionModal({ bookingId, braiderId, braiderName, reviewerId, onClose, onSuccess }: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerId) { toast.error('You must be logged in to leave a review'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, reviewer_id: reviewerId, braider_id: braiderId, rating, comment: comment || null, photos: [] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit review');
      toast.success('Review submitted!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg sm:text-xl font-serif font-bold">Review {braiderName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">How was your experience?</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                  <Star className={\`w-8 h-8 sm:w-10 sm:h-10 \${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}\`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Share your feedback (optional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us about your experience..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm" rows={4} disabled={loading} />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-semibold text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

writeFileSync('app/(admin)/admin/users/page.tsx', adminUsersPage, 'utf8');
writeFileSync('app/api/admin/users/[id]/route.ts', deleteRoute, 'utf8');
writeFileSync('app/components/ReviewSubmissionModal.tsx', reviewModal, 'utf8');

console.log('All 3 files written successfully');
console.log('admin users page:', adminUsersPage.length, 'bytes');
console.log('delete route:', deleteRoute.length, 'bytes');
console.log('review modal:', reviewModal.length, 'bytes');
