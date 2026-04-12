'use client';

import { useEffect, useState } from 'react';
import { Search, CheckCircle, Clock, X, Loader, MapPin, Mail } from 'lucide-react';

interface Braider {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  bio: string;
  avatar_url?: string;
  created_at: string;
  portfolio_images?: string[];
  years_of_experience?: number;
  specialties?: string;
  rating?: number;
  total_bookings?: number;
}

export default function BraidersPage() {
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [filteredBraiders, setFilteredBraiders] = useState<Braider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedBraider, setSelectedBraider] = useState<Braider | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchBraiders();
  }, []);

  useEffect(() => {
    let filtered = braiders;

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.verification_status === statusFilter);
    }

    setFilteredBraiders(filtered);
  }, [braiders, searchTerm, statusFilter]);

  const fetchBraiders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/braiders');
      if (!res.ok) throw new Error('Failed to fetch braiders');
      const data = await res.json();
      setBraiders(data);
    } catch (err) {
      console.error('Error fetching braiders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (braider: Braider) => {
    try {
      setVerifying(true);
      const res = await fetch(`/api/admin/braiders/${braider.id}/verify`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Verification failed');
      
      // Update local state
      setBraiders(braiders.map(b =>
        b.id === braider.id ? { ...b, verification_status: 'verified' } : b
      ));
      
      setShowModal(false);
      // Show toast notification
      alert('✅ Braider Verified Successfully');
    } catch (err) {
      console.error('Error verifying braider:', err);
      alert('❌ Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Braiders Management</h1>
        <p className="text-gray-600 mt-1">Verify and manage braider profiles</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-600"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Braiders List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      ) : filteredBraiders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No braiders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBraiders.map((braider) => (
            <div
              key={braider.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{braider.full_name}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(braider.verification_status)}`}>
                      {getStatusIcon(braider.verification_status)}
                      {braider.verification_status.charAt(0).toUpperCase() + braider.verification_status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {braider.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {braider.location}
                    </div>
                  </div>

                  {braider.bio && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{braider.bio}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedBraider(braider);
                    setShowModal(true);
                  }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedBraider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{selectedBraider.full_name}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar */}
              {selectedBraider.avatar_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedBraider.avatar_url}
                    alt={selectedBraider.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-600"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                  <p className="text-gray-900">{selectedBraider.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Phone</p>
                  <p className="text-gray-900">{selectedBraider.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Location</p>
                  <p className="text-gray-900">{selectedBraider.location}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <p className="text-gray-900 capitalize">{selectedBraider.verification_status}</p>
                </div>
              </div>

              {/* Bio */}
              {selectedBraider.bio && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Bio</p>
                  <p className="text-gray-900">{selectedBraider.bio}</p>
                </div>
              )}

              {/* Portfolio Images */}
              {selectedBraider.portfolio_images && selectedBraider.portfolio_images.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Portfolio</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedBraider.portfolio_images.map((image, idx) => (
                      <img
                        key={idx}
                        src={image}
                        alt={`Portfolio ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedBraider.verification_status === 'pending' && (
                <button
                  onClick={() => handleVerify(selectedBraider)}
                  disabled={verifying}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {verifying && <Loader className="w-4 h-4 animate-spin" />}
                  {verifying ? 'Verifying...' : 'Verify Braider'}
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
