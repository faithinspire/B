'use client';

import { ReactNode } from 'react';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';

interface BraiderPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
  success?: boolean;
  onErrorDismiss?: () => void;
}

export function BraiderPageLayout({
  title,
  subtitle,
  children,
  loading = false,
  error = '',
  success = false,
  onErrorDismiss,
}: BraiderPageLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-1 sm:mb-2">{title}</h1>
          <p className="text-primary-100 text-sm sm:text-base">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-slide-down">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">Service updated successfully!</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
            {onErrorDismiss && (
              <button
                onClick={onErrorDismiss}
                className="text-red-600 hover:text-red-700 font-semibold text-sm"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
