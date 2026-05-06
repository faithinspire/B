'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'earning' | 'payout' | 'fee';
  amount: number;
  description: string;
  created_at: string;
}

export default function BraiderWallet() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load wallet data
  useEffect(() => {
    if (!user || user.role !== 'braider') return;

    const loadWalletData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!supabase) return;

        // Load profile for balance
        const { data: profileData } = await supabase
          .from('braider_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Load transactions
        const { data: transData } = await supabase
          .from('transactions')
          .select('*')
          .eq('braider_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (transData) {
          setTransactions(transData);
        }
      } catch (err) {
        console.error('Error loading wallet:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [user]);

  if (authLoading) {
    return <BraiderPageLayout title="Wallet" subtitle="Manage your earnings" loading children={null} />;
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  return (
    <BraiderPageLayout
      title="Wallet"
      subtitle="Manage your earnings and payouts"
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
    >
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Available Balance</p>
              <p className="text-3xl font-bold mt-2">${(profile?.available_balance || 0).toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-primary-200 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">${(profile?.total_earnings || 0).toFixed(2)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-primary-100" />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((trans) => (
              <div key={trans.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    trans.type === 'earning' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {trans.type === 'earning' ? (
                      <ArrowDownLeft className={`w-5 h-5 ${trans.type === 'earning' ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{trans.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(trans.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${trans.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                  {trans.type === 'earning' ? '+' : '-'}${Math.abs(trans.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No transactions yet</p>
        )}
      </div>
    </BraiderPageLayout>
  );
}
