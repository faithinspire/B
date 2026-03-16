'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerificationPage() {
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

  const pending: any[] = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Verification</h1>
          <p className="text-gray-600">Review pending verifications</p>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {pending.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-smooth">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{item.type} • {item.date}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-2 sm:p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-smooth">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button className="p-2 sm:p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-smooth">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
