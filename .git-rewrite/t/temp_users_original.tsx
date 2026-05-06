'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Search, Trash2, Eye, AlertCircle, Loader, X, Users, TrendingUp, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'braider' | 'admin';
  created_at: string;
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

      // Get the current session to get the access token
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      // Use the API endpoint instead of direct database access
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const userData = await response.json();
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

    // Refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
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

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter(u => u.role === 'customer').length,
      braiders: users.filter(u => u.role === 'braider').length,
      admins: users.filter(u => u.role === 'admin').length,
    };
  }, [users]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      setDeletingId(userId);
      
      // Get the current session to get the access token
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary-600" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage all platform users</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-semibold">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-semibold">Braiders</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{stats.braiders}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-semibold">Customers</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.customers}</p>
                </div>
                <Users className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-semibold">Admins</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{stats.admins}</p>
                </div>
                <Shield className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No users found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary-300"
              >
                {/* Header with role badge */}
                <div className="h-1 bg-gradient-to-r from-primary-600 to-accent-600" />

                <div className="p-6">
                  {/* Name and Email */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{u.full_name}</h3>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-4">
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
                  <div className="text-xs text-gray-600 space-y-2 mb-4 pb-4 border-b border-gray-200">
                    <p><strong>ID:</strong> <span className="font-mono">{u.id.slice(0, 8)}...</span></p>
                    <p><strong>Joined:</strong> {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailsModal({ isOpen: true, user: u })}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-xs font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={deletingId === u.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-xs font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">User Details</h2>
              <button
                onClick={() => setDetailsModal({ isOpen: false, user: null })}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Details */}
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Name</p>
                  <p className="text-gray-900 font-medium mt-1">{detailsModal.user.full_name}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Email</p>
                  <p className="text-gray-900 font-medium break-all mt-1">{detailsModal.user.email}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Role</p>
                  <p className="text-gray-900 font-medium capitalize mt-1">{detailsModal.user.role}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wide">User ID</p>
                  <p className="text-gray-900 font-mono text-xs break-all mt-1">{detailsModal.user.id}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Joined</p>
                  <p className="text-gray-900 font-medium mt-1">{new Date(detailsModal.user.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteUser(detailsModal.user!.id)}
                disabled={deletingId === detailsModal.user.id}
                className="w-full mt-6 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold text-sm"
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
