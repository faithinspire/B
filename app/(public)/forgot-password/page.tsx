'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader, Mail } from 'lucide-react';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const callbackError = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    callbackError === 'link_expired'
      ? 'Your reset link has expired. Enter your email to get a new one.'
      : ''
  );
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) { setError('Email is required'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address'); return; }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive a password reset link</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-900 font-semibold">Check your email</p>
              <p className="text-green-700 text-sm mt-1">
                We've sent a password reset link to your email. Click the link in the email to set a new password.
              </p>
              <p className="text-green-600 text-xs mt-2">
                Don't see it? Check your spam/junk folder.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>How it works:</strong> You'll receive an email with a secure link. Click it to set a new password. The link expires after 1 hour.
              </p>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
