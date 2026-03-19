'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Crown, Check, Star, Zap, BookOpen, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const BENEFITS = [
  { icon: TrendingUp, text: 'Appear FIRST in all search results' },
  { icon: Star, text: 'Premium gold badge on your profile' },
  { icon: BookOpen, text: 'Personal blog page to showcase your work' },
  { icon: Zap, text: 'Priority customer matching algorithm' },
  { icon: Crown, text: 'Highest reviews displayed prominently' },
  { icon: Check, text: 'Advanced analytics dashboard' },
  { icon: Check, text: 'Featured on Premium Braiders showcase page' },
  { icon: Check, text: 'Dedicated support channel' },
];

export default function BraiderPremiumPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) setMsg('🎉 Welcome to Premium! Your account has been upgraded.');
    if (params.get('cancelled')) setMsg('Payment cancelled. You can try again anytime.');
    loadStatus();
  }, []);

  async function loadStatus() {
    const supabase = db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase
      .from('braider_profiles')
      .select('is_premium, premium_since, premium_expires_at, premium_plan')
      .eq('id', user.id)
      .single();
    setStatus(data);
  }

  async function handleSubscribe() {
    if (!userId) { router.push('/login'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          braider_id: userId,
          plan,
          success_url: window.location.origin + '/braider/premium?success=1',
          cancel_url: window.location.origin + '/braider/premium?cancelled=1',
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      if (data.activated) {
        setMsg('🎉 Premium activated! Enjoy your benefits.');
        loadStatus();
      } else {
        setMsg(data.error || 'Something went wrong');
      }
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/braider/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {msg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${msg.includes('🎉') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {msg}
          </div>
        )}

        {status?.is_premium ? (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-8 text-white text-center mb-8">
            <Crown className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">You&apos;re Premium!</h1>
            <p className="text-yellow-100 mb-2">Plan: {status.premium_plan === 'annual' ? 'Annual' : 'Monthly'}</p>
            <p className="text-yellow-100 text-sm mb-6">
              Expires: {status.premium_expires_at ? new Date(status.premium_expires_at).toLocaleDateString() : 'N/A'}
            </p>
            <Link href="/braider/blog" className="inline-block px-6 py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-yellow-50 transition-all">
              Manage Your Blog
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Crown className="w-4 h-4" /> Premium Braider Program
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Grow Your Braiding Business</h1>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">
                Get more clients, rank higher in search, and build your brand with a personal blog.
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
                <button onClick={() => setPlan('monthly')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${plan === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </button>
                <button onClick={() => setPlan('annual')}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${plan === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  Annual <span className="text-green-600 text-xs ml-1">Save 25%</span>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-8 text-white text-center mb-8 shadow-xl">
              <Crown className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-bold mb-1">
                ${plan === 'annual' ? '66' : '89'}<span className="text-2xl font-normal">/mo</span>
              </div>
              {plan === 'annual' && <p className="text-yellow-100 text-sm mb-2">Billed annually at $799/year</p>}
              <p className="text-yellow-100 mb-6">Cancel anytime</p>
              <button onClick={handleSubscribe} disabled={loading}
                className="w-full py-4 bg-white text-amber-600 rounded-xl font-bold text-lg hover:bg-yellow-50 transition-all disabled:opacity-60">
                {loading ? 'Processing...' : 'Become Premium Now'}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Everything Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
