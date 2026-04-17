'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, CheckCircle, XCircle, X, User, Star, Loader } from 'lucide-react';

interface Braider {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  bio: string;
  verification_status: 'unverified' | 'pending' | 'approved' | 'rejected' | string;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  unverified: number;
}

export default function VerificationPage() {
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, unverified: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // format: "braider_id:action"
  const [selectedBraider, setSelectedBraider] = useState<Braider | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchBraiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/verification?status=all');

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to load');

      setBraiders(data.data || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, unverified: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load braiders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBraiders();
  }, []);

  const handleAction = async (braider_id: string, action: 'approve' | 'reject') => {
    const loadingKey = `${braider_id}:${action}`;
    try {
      setActionLoading(loadingKey);
      setActionMessage('');

      const endpoint = action === 'approve'
        ? '/api/admin/verification/approve'
        : '/api/admin/verification/reject';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ braider_id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to ${action}`);
      }

      setActionMessage(`Braider ${action === 'approve' ? 'approved ✅' : 'rejected ❌'} successfully!`);
      setSelectedBraider(null);
      await fetchBraiders();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} braider`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBraiders = braiders.filter(b => {
    const matchesSearch =
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Rejected</span>;
      case 'unverified':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Unverified</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading braiders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Braider Verification</h1>
          <p className="text-gray-600 text-sm">Review and approve braider applications</p>
        </div>

        {/* Success Message */}
        {actionMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm font-semibold">{actionMessage}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Unverified', value: stats.unverified, color: 'text-gray-600' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Approved', value: stats.approved, color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold text-sm">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="unverified">Unverified</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchBraiders}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBraiders.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No braiders found</p>
              <p className="text-gray-500 text-sm mt-1">
                {statusFilter !== 'all' ? `No ${statusFilter} braiders` : 'No braiders registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Braider</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBraiders.map(braider => (
                    <tr key={braider.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {braider.avatar_url ? (
                            <img src={braider.avatar_url} alt={braider.full_name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                              {braider.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{braider.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{braider.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{braider.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-700">{(braider.rating_avg || 0).toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({braider.rating_count || 0})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(braider.verification_status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(braider.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedBraider(braider)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                          >
                            View
                          </button>
                          {(braider.verification_status === 'pending' || braider.verification_status === 'unverified') && (
                            <>
                              <button
                                onClick={() => handleAction(braider.id, 'approve')}
                                disabled={actionLoading === `${braider.id}:approve`}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === `${braider.id}:approve` ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(braider.id, 'reject')}
                                disabled={actionLoading === `${braider.id}:reject`}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === `${braider.id}:reject` ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Reject
                              </button>
                            </>
                          )}
                          {braider.verification_status === 'approved' && (
                            <button
                              onClick={() => handleAction(braider.id, 'reject')}
                              disabled={actionLoading === `${braider.id}:reject`}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          )}
                          {braider.verification_status === 'rejected' && (
                            <button
                              onClick={() => handleAction(braider.id, 'approve')}
                              disabled={actionLoading === `${braider.id}:approve`}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                            >
                              Re-approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Showing {filteredBraiders.length} of {braiders.length} braiders
        </p>
      </div>

      {/* Detail Modal */}
      {selectedBraider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold text-gray-900">Braider Details</h2>
              <button onClick={() => setSelectedBraider(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-4">
                {selectedBraider.avatar_url ? (
                  <img src={selectedBraider.avatar_url} alt={selectedBraider.full_name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-2xl">
                    {selectedBraider.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedBraider.full_name}</h3>
                  <p className="text-gray-600 text-sm">{selectedBraider.email}</p>
                  <div className="mt-1">{getStatusBadge(selectedBraider.verification_status)}</div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedBraider.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-900">{(selectedBraider.rating_avg || 0).toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({selectedBraider.rating_count || 0} reviews)</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Active</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedBraider.is_active ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Joined</p>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedBraider.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedBraider.bio && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bio</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedBraider.bio}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(selectedBraider.verification_status === 'pending' || selectedBraider.verification_status === 'unverified') && (
              <div className="border-t p-5 flex gap-3">
                <button
                  onClick={() => handleAction(selectedBraider.id, 'reject')}
                  disabled={actionLoading === `${selectedBraider.id}:reject`}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {actionLoading === `${selectedBraider.id}:reject` ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedBraider.id, 'approve')}
                  disabled={actionLoading === `${selectedBraider.id}:approve`}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {actionLoading === `${selectedBraider.id}:approve` ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
