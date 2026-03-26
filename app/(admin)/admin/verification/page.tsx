'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { CheckCircle, XCircle, Eye, Clock, User, FileText, Camera } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VerificationPage() {
  const router = useRouter();
  const { user } = useSupabaseAuthStore();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [all, setAll] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchBraiders();
  }, [user, router]);

  async function fetchBraiders() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from('braider_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setAll(data);
    } catch {}
    finally { setLoading(false); }
  }

  const filtered = all.filter(b =>
    tab === 'pending' ? b.verification_status === 'pending' :
    tab === 'verified' ? b.verification_status === 'verified' :
    b.verification_status === 'rejected'
  );

  async function updateStatus(braider: any, status: 'verified' | 'rejected') {
    setProcessing(braider.id);
    try {
      const { error } = await sb
        .from('braider_profiles')
        .update({ verification_status: status })
        .eq('id', braider.id);
      if (!error) {
        setAll(prev => prev.map(b => b.id === braider.id ? { ...b, verification_status: status } : b));
        setSelected(null);
        // Notify braider
        await sb.from('notifications').insert({
          user_id: braider.user_id,
          type: 'verification_update',
          title: status === 'verified' ? 'Verification Approved!' : 'Verification Rejected',
          body: status === 'verified'
            ? 'Congratulations! Your identity has been verified. You can now accept bookings.'
            : 'Your verification was not approved. Please re-upload your documents.',
          data: { status },
        }).catch(() => {});
      }
    } catch {}
    finally { setProcessing(null); }
  }

  if (!user || user.role !== 'admin') return null;

  const tabCounts = {
    pending: all.filter(b => b.verification_status === 'pending').length,
    verified: all.filter(b => b.verification_status === 'verified').length,
    rejected: all.filter(b => b.verification_status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Braider Verification</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review and approve braider identity documents</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-200 w-fit">
          {(['pending', 'verified', 'rejected'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize flex items-center gap-2 ${
                tab === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {t}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>{tabCounts[t]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mr-3"/>Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {tab} verifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {b.avatar_url
                      ? <img src={b.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {(b.full_name||'?').charAt(0).toUpperCase()}
                        </div>
                    }
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{b.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate">{b.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                          b.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{b.verification_status}</span>
                        <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setSelected(b)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {tab === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b, 'verified')} disabled={processing === b.id}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(b, 'rejected')} disabled={processing === b.id}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {tab === 'verified' && (
                      <button onClick={() => updateStatus(b, 'rejected')} disabled={processing === b.id}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                        Revoke
                      </button>
                    )}
                    {tab === 'rejected' && (
                      <button onClick={() => updateStatus(b, 'verified')} disabled={processing === b.id}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50">
                        Approve
                      </button>
                    )}
                  </div>
                </div>

                {/* Document indicators */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className={`flex items-center gap-1.5 text-xs ${b.id_document_url ? 'text-green-600' : 'text-gray-400'}`}>
                    <FileText className="w-3.5 h-3.5" />
                    <span>ID Doc {b.id_document_url ? '✓' : '✗'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${b.selfie_url ? 'text-green-600' : 'text-gray-400'}`}>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Selfie {b.selfie_url ? '✓' : '✗'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${b.background_check_consent ? 'text-green-600' : 'text-gray-400'}`}>
                    <User className="w-3.5 h-3.5" />
                    <span>BG Check {b.background_check_consent ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Verification Details</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full text-lg font-bold">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                {selected.avatar_url
                  ? <img src={selected.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl">
                      {(selected.full_name||'?').charAt(0).toUpperCase()}
                    </div>
                }
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selected.full_name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <p className="text-xs text-gray-400">{selected.phone || 'No phone'}</p>
                </div>
              </div>

              {selected.id_document_url && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">ID Document</p>
                  <img src={selected.id_document_url} alt="ID Document" className="w-full rounded-lg border border-gray-200 max-h-64 object-contain bg-gray-50" />
                </div>
              )}

              {selected.selfie_url && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Selfie</p>
                  <img src={selected.selfie_url} alt="Selfie" className="w-full rounded-lg border border-gray-200 max-h-64 object-contain bg-gray-50" />
                </div>
              )}

              {!selected.id_document_url && !selected.selfie_url && (
                <div className="text-center py-6 text-gray-400 text-sm">No documents uploaded yet</div>
              )}

              {selected.verification_status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => updateStatus(selected, 'verified')} disabled={processing === selected.id}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button onClick={() => updateStatus(selected, 'rejected')} disabled={processing === selected.id}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
