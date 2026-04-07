'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';

interface BraiderProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  id_document_url?: string;
  selfie_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export default function VerificationContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [braiders, setBraiders] = useState<BraiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchBraiders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/verification');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setBraiders(data.braiders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading braiders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    fetchBraiders();
  }, [user, authLoading, fetchBraiders]);

  const handleVerify = async (braiderId: string, status: 'verified' | 'rejected') => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/verification/${braiderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update');
      await fetchBraiders();
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 text-primary-600 animate-spin border-4 border-primary-200 border-t-primary-600 rounded-full" /></div>;
  if (!user || user.role !== 'admin') return null;

  const selected = braiders.find(b => b.id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20 md:pb-8">
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900">Braider Verification</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Review pending braiders</p>
          </div>
          <button onClick={fetchBraiders} disabled={loading} className="p-2 sm:p-3 bg-primary-100 hover:bg-primary-200 rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-4 sm:w-5 h-4 sm:h-5 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {error && <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><div className="w-10 sm:w-12 h-10 sm:h-12 text-primary-600 animate-spin mx-auto mb-3 border-4 border-primary-200 border-t-primary-600 rounded-full" /></div>
        ) : braiders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow"><Users className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600 font-semibold">No pending braiders</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {braiders.map((braider) => (
              <div key={braider.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedId(braider.id)}>
                <h3 className="font-semibold text-gray-900 text-sm truncate">{braider.full_name}</h3>
                <p className="text-xs text-gray-600 truncate">{braider.email}</p>
                {braider.phone_number && <p className="text-xs text-gray-600 mt-1">{braider.phone_number}</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleVerify(braider.id, 'verified'); }} disabled={updating} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded disabled:opacity-50"><CheckCircle className="w-3 h-3 inline mr-1" />Approve</button>
                  <button onClick={(e) => { e.stopPropagation(); handleVerify(braider.id, 'rejected'); }} disabled={updating} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded disabled:opacity-50"><XCircle className="w-3 h-3 inline mr-1" />Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedId(null)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selected.full_name}</h2>
              <div className="space-y-3 text-sm">
                <div><p className="text-gray-600">Email</p><p className="font-semibold text-gray-900">{selected.email}</p></div>
                {selected.phone_number && <div><p className="text-gray-600">Phone</p><p className="font-semibold text-gray-900">{selected.phone_number}</p></div>}
                {selected.next_of_kin_name && <div><p className="text-gray-600">Next of Kin</p><p className="font-semibold text-gray-900">{selected.next_of_kin_name}</p></div>}
                {selected.id_document_url && <div><p className="text-gray-600 mb-2">ID Document</p><img src={selected.id_document_url} alt="ID" className="w-full h-40 object-cover rounded" /></div>}
                {selected.selfie_url && <div><p className="text-gray-600 mb-2">Selfie</p><img src={selected.selfie_url} alt="Selfie" className="w-full h-40 object-cover rounded" /></div>}
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button onClick={() => handleVerify(selected.id, 'verified')} disabled={updating} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:opacity-50">Approve</button>
                <button onClick={() => handleVerify(selected.id, 'rejected')} disabled={updating} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded disabled:opacity-50">Reject</button>
                <button onClick={() => setSelectedId(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
