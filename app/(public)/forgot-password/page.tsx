'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
            <Mail className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm">Enter your email and we'll send you a reset link</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors disabled:bg-gray-50"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                Check your spam folder if you don't see the email within a few minutes.
              </div>
            </form>
          ) : (
            /* Success Message */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-sm text-gray-600">
                  We've sent a password reset link to <span className="font-semibold">{email}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  The link expires in 1 hour.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-semibold"
              >
                Send Another Email
              </button>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Remember your password?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
