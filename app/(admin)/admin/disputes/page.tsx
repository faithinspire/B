'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AlertTriangle } from 'lucide-react';

export default function DisputesPage() {
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

  const disputes: any[] = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Disputes</h1>
          <p className="text-gray-600">Manage customer disputes and resolutions</p>
        </div>
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 hover:shadow-xl transition-smooth">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <AlertTriangle className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base break-words">{dispute.reason}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{dispute.customer} vs {dispute.braider}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 ${
                  dispute.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {dispute.status}
                </span>
              </div>
              <button className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-xs sm:text-sm md:text-base font-semibold">
                Review
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
