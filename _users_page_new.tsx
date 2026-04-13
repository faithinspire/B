'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, X, Send } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  avatar_url: string | null;
  rating: number | null;
  verification_status: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Stats {
  total: number;
  admins: number;
  braiders: number;
  customers: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, braiders: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setStats(data.stats || { total: 0, admins: 0, braiders: 0, customers: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/conversations?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setMessages([]);
    setMessageText('');
    fetchMessages(user.id);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;

    try {
      setSendingMessage(true);
      const response = await fetch('/api/admin/conversations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: messageText,
        }),
      });

      if (response.ok) {
        setMessageText('');
        await fetchMessages(selectedUser.id);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Manage all platform users and their roles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Admins</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.admins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Braiders</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.braiders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Customers</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.customers}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error loading users</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={fetchUsers}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="braider">Braider</option>
                <option value="customer">Customer</option>
              </select>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'braider' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSelectUser(user)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{selectedUser.full_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedUser.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Member Since</label>
                      <p className="text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Sign In</label>
                      <p className="text-gray-900">
                        {selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    {selectedUser.role === 'braider' && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Rating</label>
                          <p className="text-gray-900">{selectedUser.rating ? `${selectedUser.rating.toFixed(1)}/5` : 'No ratings'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Verification Status</label>
                          <p className="text-gray-900 capitalize">{selectedUser.verification_status || 'Pending'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto max-h-64 border border-gray-200">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div key={msg.id} className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs font-medium text-gray-600">{msg.sender_name}</p>
                            <p className="text-sm text-gray-900 mt-1">{msg.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
