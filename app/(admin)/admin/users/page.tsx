'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Search, Trash2, Eye, AlertCircle, Loader, Filter, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'braider' | 'admin';
  created_at: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  avatar_url?: string;
}

interface UserDetailsModal {
  isOpen: boolean;
  user: User | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'braider' | 'admin'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState<UserDetailsModal>({ isOpen: false, user: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    try {
      setLoading(true);
      setError(null);

      if (!supabase) throw new Error('Supabase not initialized');

      // Fetch users with next of kin data
      const { data: userData, error: userErr } = await supabase
        .from('auth.users')
        .select('id, email, full_name, role, created_at, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship, avatar_url')
        .order('created_at', { ascending: false });

      if (userErr) throw userErr;

      setUsers(userData || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;

    fetchUsers();

    // Real-time subscription
    const subscription = supabase
      .channel('admin_users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auth.users' },
        () => fetchUsers()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user, authLoading, fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      setDeletingId(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete user');

      setUsers(users.filter(u => u.id !== userId));
      setDetailsModal({ isOpen: false, user: null });
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Users</h1>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="braider">Braiders</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 font-semibold">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 border-l-4 border-primary-600"
              >
                {/* Avatar and Name */}
                <div className="flex items-start gap-3 mb-3">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{u.full_name}</h3>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : u.role === 'braider'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                </div>

                {/* Info */}
                <div className="text-xs text-gray-600 space-y-1 mb-3 pb-3 border-b border-gray-200">
                  <p><strong>ID:</strong> {u.id.slice(0, 8)}...</p>
                  <p><strong>Joined:</strong> {new Date(u.created_at).toLocaleDateString()}</p>
                  {u.next_of_kin_name && (
                    <>
                      <p><strong>Next of Kin:</strong> {u.next_of_kin_name}</p>
                      {u.next_of_kin_relationship && (
                        <p><strong>Relationship:</strong> {u.next_of_kin_relationship}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDetailsModal({ isOpen: true, user: u })}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-smooth text-xs font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={deletingId === u.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-smooth text-xs font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
              <h2 className="font-bold">User Details</h2>
              <button
                onClick={() => setDetailsModal({ isOpen: false, user: null })}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Avatar */}
              {detailsModal.user.avatar_url && (
                <img
                  src={detailsModal.user.avatar_url}
                  alt={detailsModal.user.full_name}
                  className="w-20 h-20 rounded-full object-cover mx-auto"
                />
              )}

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 font-semibold">Name</p>
                  <p className="text-gray-900">{detailsModal.user.full_name}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold">Email</p>
                  <p className="text-gray-900 break-all">{detailsModal.user.email}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold">Role</p>
                  <p className="text-gray-900 capitalize">{detailsModal.user.role}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold">User ID</p>
                  <p className="text-gray-900 font-mono text-xs break-all">{detailsModal.user.id}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold">Joined</p>
                  <p className="text-gray-900">{new Date(detailsModal.user.created_at).toLocaleString()}</p>
                </div>

                {/* Next of Kin */}
                {detailsModal.user.next_of_kin_name && (
                  <>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-600 font-semibold mb-2">Next of Kin Information</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-600 text-xs">Name</p>
                          <p className="text-gray-900">{detailsModal.user.next_of_kin_name}</p>
                        </div>
                        {detailsModal.user.next_of_kin_phone && (
                          <div>
                            <p className="text-gray-600 text-xs">Phone</p>
                            <p className="text-gray-900">{detailsModal.user.next_of_kin_phone}</p>
                          </div>
                        )}
                        {detailsModal.user.next_of_kin_relationship && (
                          <div>
                            <p className="text-gray-600 text-xs">Relationship</p>
                            <p className="text-gray-900">{detailsModal.user.next_of_kin_relationship}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteUser(detailsModal.user!.id)}
                disabled={deletingId === detailsModal.user.id}
                className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-smooth font-semibold text-sm"
              >
                {deletingId === detailsModal.user.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
