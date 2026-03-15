'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Share2, Copy, Users, DollarSign, TrendingUp, Loader } from 'lucide-react';

export default function ReferralsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const referralLink = user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup/customer?ref=${user.id}` : '';

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
    }
  };

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check if user is authenticated and is a customer
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'customer') {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">Referral Program</h1>
          <p className="text-primary-100">Earn rewards by inviting friends</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <Users className="w-12 h-12 text-primary-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$0.00</p>
              </div>
              <DollarSign className="w-12 h-12 text-accent-100" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animate-delay-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Bonus Potential</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$500</p>
              </div>
              <TrendingUp className="w-12 h-12 text-secondary-100" />
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 animate-fade-in">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Your Referral Link</h2>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center justify-between">
            <code className="text-sm text-gray-600 break-all">{referralLink}</code>
            <button
              onClick={handleCopy}
              className="ml-4 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth flex-shrink-0"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share on Social
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-smooth font-semibold flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Link
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl shadow-lg p-8 animate-slide-up">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Share Your Link</h3>
                <p className="text-gray-600">Send your referral link to friends and family</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">They Sign Up</h3>
                <p className="text-gray-600">Your friends create an account using your link</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">They Book</h3>
                <p className="text-gray-600">Your friends book their first appointment</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">You Earn</h3>
                <p className="text-gray-600">Get $25 credit for each successful referral</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
