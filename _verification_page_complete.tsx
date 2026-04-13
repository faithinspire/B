'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, CheckCircle, XCircle, X } from 'lucide-react';

interface BraiderVerification {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  phone: string;
  bio: string;
  specialization: string;
  state: string;
  city: string;
  address: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function VerificationPage() {
  const [braiders, setBraiders] = useState<BraiderVerification[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBraider, setSelectedBraider] = useState<BraiderVerification | null>(null);

  const fetchBraiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/verification');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch braiders: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBraiders(data.braiders || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load braiders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBraiders();
  }, []);

  const handleApprove = async (braider_id: string) => {
    try {
      setActionLoading(braider_id);
      const response = await fetch('/api/admin/verification/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ braider_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve braider');
      }

      setSelectedBraider(null);
      await fetchBraiders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve braider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (braider_id: string) => {
    try {
      setActionLoading(braider_id);
      const response = await fetch('/api/admin/verification/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ braider_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject braider');
      }

      setSelectedBraider(null);
      await fetchBraiders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject braider');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBraiders = braiders.filter(braider => {
    const matchesSearch = braider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         braider.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || braider.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading braiders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Braider Verification</h1>
          <p className="text-gray-600">Review and manage braider verification requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Braiders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={fetchBraiders}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchBraiders}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBraiders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No braiders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Specialization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBraiders.map((braider) => (
                    <tr key={braider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{braider.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{braider.full_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{braider.specialization || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {braider.verification_status === 'pending' && (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs font-medium text-yellow-700">Pending</span>
                            </>
                          )}
                          {braider.verification_status === 'approved' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Approved</span>
                            </>
                          )}
                          {braider.verification_status === 'rejected' && (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-medium text-red-700">Rejected</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(braider.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => setSelectedBraider(braider)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                        {braider.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(braider.id)}
                              disabled={actionLoading === braider.id}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                            >
                              {actionLoading === braider.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(braider.id)}
                              disabled={actionLoading === braider.id}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs"
                            >
                              {actionLoading === braider.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredBraiders.length} of {braiders.length} braiders
        </div>
      </div>

      {/* Braider Details Modal */}
      {selectedBraider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Braider Details</h2>
              <button
                onClick={() => setSelectedBraider(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedBraider.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{selectedBraider.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedBraider.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className="text-gray-900 capitalize">{selectedBraider.verification_status}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Specialization</label>
                      <p className="text-gray-900">{selectedBraider.specialization || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Applied Date</label>
                      <p className="text-gray-900">{new Date(selectedBraider.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">State</label>
                      <p className="text-gray-900">{selectedBraider.state || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-gray-900">{selectedBraider.city || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900">{selectedBraider.address || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
                  <p className="text-gray-900">{selectedBraider.bio || '-'}</p>
                </div>
              </div>
            </div>

            {selectedBraider.verification_status === 'pending' && (
              <div className="border-t border-gray-200 p-6 flex gap-3">
                <button
                  onClick={() => handleReject(selectedBraider.id)}
                  disabled={actionLoading === selectedBraider.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {actionLoading === selectedBraider.id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(selectedBraider.id)}
                  disabled={actionLoading === selectedBraider.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {actionLoading === selectedBraider.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
