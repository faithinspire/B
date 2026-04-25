'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Shield } from 'lucide-react';

interface Braider {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  bio: string;
  verification_status: string;
  raw_verification_status: string;
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

export default function AdminVerificationPage() {
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, unverified: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBraiders();
  }, [filter]);

  async function fetchBraiders() {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'all'
        ? '/api/admin/verification'
        : `/api/admin/verification?status=${filter}`;

      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || `Error ${res.status}`);
        setBraiders([]);
        return;
      }

      setBraiders(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load braiders');
      setBraiders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(braiderId: string) {
    setActionLoading(braiderId);
    try {
      const res = await fetch('/api/admin/verification/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ braider_id: braiderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to approve');
      await fetchBraiders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(braiderId: string) {
    setActionLoading(braiderId);
    try {
      const res = await fetch('/api/admin/verification/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ braider_id: braiderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reject');
      await fetchBraiders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'rejected') return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <Shield className="w-4 h-4 text-gray-400" />;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      unverified: 'bg-gray-100 text-gray-600',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const filters = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
    { key: 'unverified', label: 'Unverified', count: stats.unverified },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Braider Verification</h1>
          <p className="text-gray-600 text-sm mt-1">Review and approve braider applications</p>
        </div>
        <button
          onClick={fetchBraiders}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-semibold text-sm">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchBraiders} className="mt-1 text-red-600 text-sm font-semibold hover:underline">
              Try Again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : braiders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          No braiders found for this filter
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Braider</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {braiders.map(braider => (
                  <tr key={braider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {braider.avatar_url ? (
                          <img src={braider.avatar_url} alt={braider.full_name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                            {braider.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{braider.full_name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">{braider.bio || 'No bio'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{braider.email}</p>
                      <p className="text-xs text-gray-500">{braider.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(braider.verification_status)}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(braider.verification_status)}`}>
                          {braider.verification_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {braider.rating_avg > 0 ? `${braider.rating_avg.toFixed(1)} ⭐ (${braider.rating_count})` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(braider.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {braider.verification_status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(braider.id)}
                            disabled={actionLoading === braider.id}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === braider.id ? '...' : 'Approve'}
                          </button>
                        )}
                        {braider.verification_status !== 'rejected' && (
                          <button
                            onClick={() => handleReject(braider.id)}
                            disabled={actionLoading === braider.id}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === braider.id ? '...' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
