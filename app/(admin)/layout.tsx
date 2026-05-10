'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AdminSidebar } from '@/app/components/admin/AdminSidebar';
import { AdminHeader } from '@/app/components/admin/AdminHeader';
import { Loader, AlertCircle } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, refreshRole } = useSupabaseAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setIsChecking(true);
        setError(null);

        // If still loading auth, wait
        if (loading) {
          return;
        }

        // If no user, redirect to login
        if (!user) {
          console.log('No user found, redirecting to login');
          router.push('/login');
          return;
        }

        // If user is admin, allow access
        if (user.role === 'admin') {
          console.log('✅ Admin access granted');
          setIsChecking(false);
          return;
        }

        // If user is not admin, try refreshing role once
        if (user.role !== 'admin') {
          console.log('User role is not admin, attempting refresh...');
          await refreshRole();
          
          // Check updated role
          const updatedUser = useSupabaseAuthStore.getState().user;
          if (updatedUser?.role === 'admin') {
            console.log('✅ Admin role confirmed after refresh');
            setIsChecking(false);
            return;
          }

          // Still not admin, redirect to signup dashboard
          console.log(`User role is ${updatedUser?.role}, not admin. Redirecting to dashboard.`);
          setError(`Your account role is "${updatedUser?.role}", not "admin". Please contact support if this is incorrect.`);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }
      } catch (err) {
        console.error('Admin access check error:', err);
        setError('Error checking admin access');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, [user, loading, router, refreshRole]);

  // Show loading state
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">Access Denied</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Content Area - Fixed scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 pb-24">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
