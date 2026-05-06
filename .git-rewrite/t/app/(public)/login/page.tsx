'use client';

export const dynamic = 'force-dynamic';

import { MultiCountryLoginForm } from '@/app/components/MultiCountryLoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your BraidMe account</p>
        </div>

        <MultiCountryLoginForm />

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-900">
            <strong>Tip:</strong> Select your country first, then choose your preferred login method (email or phone).
          </p>
        </div>
      </div>
    </div>
  );
}
