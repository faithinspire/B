'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Users, Scissors, Shield, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">B</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4 text-gray-900">Join BraidMee</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose your role and start your journey with us</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {/* Customer Card */}
          <Link href="/signup/customer">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 text-center">
                <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">I'm a Customer</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">Book verified braiders & barbers with secure escrow payments</p>
                <ul className="space-y-2 mb-6">
                  {['Browse verified pros', 'Secure booking', 'Escrow protection', 'Dispute resolution'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>

          {/* Braider Card */}
          <Link href="/signup/braider">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full border-2 border-purple-600">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center">
                <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">✂️</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">I'm a Braider</h2>
                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Popular</span>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">Grow your braiding business and earn with secure payments</p>
                <ul className="space-y-2 mb-6">
                  {['Grow your client base', 'Secure payments', 'Pro verification', 'Earnings dashboard'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>

          {/* Barber Card */}
          <Link href="/signup/barber">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full border-2 border-blue-600">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💈</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">I'm a Barber</h2>
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">New</span>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">Reach more clients for fades, cuts, and grooming services</p>
                <ul className="space-y-2 mb-6">
                  {['Grow your client base', 'Secure payments', 'Pro verification', 'Earnings dashboard'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/signup/admin">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
                <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">I'm an Admin</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">Manage platform, verify users, handle disputes</p>
                <ul className="space-y-2 mb-6">
                  {['User management', 'Dispute resolution', 'Platform analytics', 'Security controls'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                  Admin Access <ArrowRight className="w-4 h-4" />
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
