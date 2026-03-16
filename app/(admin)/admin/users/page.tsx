'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Search, MoreVertical, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'braider' | 'admin';
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      // Call the API endpoint instead of querying Supabase directly
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

      const data = await response.json();
      setUsers(data);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-8" style={{ paddingTop: 0, marginTop: 0 }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8" style={{ paddingTop: '1rem' }}>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-1 sm:mb-2">Users</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage all platform users</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-lg focus:outline-none focus:border-primary-600 transition-smooth text-xs sm:text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-10 sm:w-12 h-10 sm:h-12 text-primary-600 animate-spin mx-auto mb-3 sm:mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            <p className="text-sm sm:text-base text-gray-600 font-semibold">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg sm:rounded-xl shadow">
            <p className="text-base sm:text-lg text-gray-600 font-semibold">No users found</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              {searchQuery ? 'No users match your search' : 'No users registered yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Name</th>
                    <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 hidden sm:table-cell">Email</th>
                    <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Role</th>
                    <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900 hidden md:table-cell">Joined</th>
                    <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50 transition-smooth">
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-gray-900 break-words text-xs sm:text-sm">{u.full_name}</td>
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-gray-600 break-all text-xs sm:text-sm hidden sm:table-cell">{u.email}</td>
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'braider' ? 'bg-purple-100 text-purple-700' :
                          'bg-primary-100 text-primary-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3">
                        <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-smooth">
                          <MoreVertical className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
