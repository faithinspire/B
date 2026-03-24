'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Users, Scissors, Shield, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">B</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4 text-gray-900">Join BraidMe</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose your role and start your journey with us</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Customer Card */}
          <Link href="/signup/customer">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-8 text-center">
                <div className="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">I'm a Customer</h2>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6">
                  Book verified braiders, secure payments, and enjoy peace of mind with escrow protection
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center text-xs font-bold text-secondary-600">✓</span>
                    Browse verified braiders
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center text-xs font-bold text-secondary-600">✓</span>
                    Secure booking system
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center text-xs font-bold text-secondary-600">✓</span>
                    Escrow protection
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center text-xs font-bold text-secondary-600">✓</span>
                    Dispute resolution
                  </li>
                </ul>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>

          {/* Braider Card */}
          <Link href="/signup/braider">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full border-2 border-primary-600">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Scissors className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">I'm a Braider</h2>
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">Popular</span>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6">
                  Grow your business, reach more clients, and earn with secure payments and verified customers
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">✓</span>
                    Grow your client base
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">✓</span>
                    Secure payments
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">✓</span>
                    Professional verification
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">✓</span>
                    Earnings dashboard
                  </li>
                </ul>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/signup/admin">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">I'm an Admin</h2>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6">
                  Manage platform, verify users, handle disputes, and oversee operations
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">✓</span>
                    User management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">✓</span>
                    Dispute resolution
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">✓</span>
                    Platform analytics
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">✓</span>
                    Security controls
                  </li>
                </ul>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                  Admin Access
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
