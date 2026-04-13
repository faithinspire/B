'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Loader } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseAuthStore();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/login');
      } else {
        // Redirect to dashboard
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-semibold">Loading dashboard...</p>
      </div>
    </div>
  );
}
