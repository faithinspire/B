'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, Phone, Loader, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Barber {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  verification_status: string;
  city: string;
  state: string;
  country: string;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function BarberPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get barbers from profiles table where profession_type = 'barber'
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('profession_type', 'barber')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Barbers query error:', profilesError);
        setError('Failed to load barbers');
        setBarbers([]);
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
        return;
      }

      const barberList = Array.isArray(profiles) ? profiles : [];

      // Get verification statuses from braider_profiles if available
      let verificationMap: Record<string, string> = {};
      try {
        const { data: braiderProfiles } = await supabase
          .from('braider_profiles')
          .select('user_id, verification_status')
          .eq('profession_type', 'barber');

        if (braiderProfiles) {
          verificationMap = Object.fromEntries(
            braiderProfiles.map(bp => [bp.user_id, bp.verification_status])
          );
        }
      } catch (e) {
        console.warn('Could not fetch barber verification statuses');
      }

      // Map to barber interface
      const mappedBarbers: Barber[] = barberList.map(profile => ({
        id: profile.id,
        user_id: profile.id,
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || null,
        verification_status: verificationMap[profile.id] || 'unverified',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        rating_avg: profile.rating_avg || 0,
        rating_count: profile.rating_count || 0,
        created_at: profile.created_at,
      }));

      setBarbers(mappedBarbers);

      // Calculate stats
      const newStats = {
        total: mappedBarbers.length,
        pending: mappedBarbers.filter(b => b.verification_status === 'pending').length,
        approved: mappedBarbers.filter(b => b.verification_status === 'approved').length,
        rejected: mappedBarbers.filter(b => b.verification_status === 'rejected').length,
      };
      setStats(newStats);
    } catch (err) {
      console.error('Barbers fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load barbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();

    // Set up real-time subscription
    let subscription: any = null;
    if (supabase) {
      subscription = supabase
        .channel('admin-barbers-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            fetchBarbers();
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase?.removeChannel(subscription);
      }
    };
  }, []);

  const filteredBarbers = barbers.filter(barber => {
    const matchesSearch =
      barber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (barber.full_name && barber.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || barber.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Verified</span>;
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Rejected</span>;
      case 'unverified':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">Unverified</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading barbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Barber Management</h1>
          <p className="text-gray-600 text-sm">View and manage all barbers on the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Barbers', value: stats.total, color: 'text-gray-900' },
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
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchBarbers}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBarbers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 font-semibold">No barbers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Barber</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBarbers.map(barber => (
                    <tr key={barber.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {barber.avatar_url ? (
                            <img src={barber.avatar_url} alt={barber.full_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                              {barber.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{barber.full_name || '-'}</p>
                            <p className="text-xs text-gray-500">{barber.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {barber.city && barber.state ? `${barber.city}, ${barber.state}` : barber.country || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {barber.phone ? (
                          <a href={`tel:${barber.phone}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {barber.phone}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {getVerificationBadge(barber.verification_status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {barber.rating_count > 0 ? (
                          <span className="font-semibold">{barber.rating_avg.toFixed(1)} ⭐ ({barber.rating_count})</span>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(barber.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Showing {filteredBarbers.length} of {barbers.length} barbers
        </p>
      </div>
    </div>
  );
}
