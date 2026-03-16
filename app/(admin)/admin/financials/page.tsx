'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { DollarSign, TrendingUp } from 'lucide-react';

export default function FinancialsPage() {
  const router = useRouter();
  const { user } = useSupabaseAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Financials</h1>
          <p className="text-gray-600">Platform revenue and analytics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-smooth">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-xs sm:text-sm">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">$45,230</p>
              </div>
              <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-accent-100 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-smooth">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-xs sm:text-sm">Monthly Growth</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">+12.5%</p>
              </div>
              <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-green-100 flex-shrink-0" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-4 sm:mb-6">Revenue Breakdown</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Booking Fees</span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">$32,450</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Premium Features</span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">$8,230</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Referral Bonuses</span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">$4,550</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
