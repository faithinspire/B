'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if there's an error from the callback (e.g. expired link)
  const callbackError = searchParams?.get('error');

  useEffect(() => {
    // After the /auth/callback route exchanges the code, Supabase sets a
    // session cookie. We verify the session is active before showing the form.
    const checkSession = async () => {
      if (!supabase) {
        setError('Supabase not configured');
        setChecking(false);
        return;
      }

      if (callbackError === 'link_expired') {
        setError('This reset link has expired or is invalid. Please request a new one.');
        setChecking(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
        } else {
          setError('Reset link is invalid or has expired. Please request a new one.');
        }
      } catch (err) {
        setError('Could not verify reset link. Please request a new one.');
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, [callbackError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!supabase) { setError('Supabase not configured'); return; }

    setLoading(true);

    try {
      // Use Supabase's native updateUser — works because the session from the
      // email link is active in the browser after /auth/callback ran.
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || 'Failed to reset password. Please try again.');
        return;
      }

      setSuccess(true);
      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();

      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Create New Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-900 font-semibold">Password reset successful!</p>
              <p className="text-green-700 text-sm mt-1">Redirecting to login...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm">{error}</p>
              <Link href="/forgot-password" className="text-red-600 hover:text-red-700 font-semibold text-sm mt-2 inline-block">
                Request a new reset link →
              </Link>
            </div>
          </div>
        )}

        {!success && sessionReady && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Use at least 8 characters with a mix of letters and numbers.
              </p>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
