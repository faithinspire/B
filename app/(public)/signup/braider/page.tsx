'use client';

export const dynamic = 'force-dynamic';

import { BraiderSignupForm } from '@/app/components/BraiderSignupForm';
import Link from 'next/link';

export default function BraiderSignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Become a Braider</h1>
          <p className="text-gray-600">Join our community and start earning. Complete all steps to get verified.</p>
        </div>

        <BraiderSignupForm />

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>By signing up, you agree to our</strong>{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
