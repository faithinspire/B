'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { loginSchema } from '@/lib/validations';
import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, loading, error } = useSupabaseAuthStore();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const validated = loginSchema.parse(formData);
      await signIn(validated.email, validated.password);
      
      // Check if user is admin
      const currentUser = useSupabaseAuthStore.getState().user;
      if (currentUser?.role === 'admin') {
        router.push('/admin');
      } else {
        setErrors({ submit: 'You do not have admin access. Please contact support.' });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      } else {
        setErrors({ submit: error.message || 'Login failed. Please try again.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 sm:px-8 py-8 sm:py-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1 sm:mb-2">Admin Portal</h1>
            <p className="text-primary-100 text-sm sm:text-base">Secure administrator access</p>
          </div>

          {/* Error Alert */}
          {(errors.submit || error) && (
            <div className="mx-4 sm:mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-red-700 font-medium">{errors.submit || error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting || loading}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                    errors.email
                      ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
                      : 'border-gray-200 focus:border-primary-600 focus:ring-primary-100'
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  placeholder="admin@braidme.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting || loading}
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                    errors.password
                      ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
                      : 'border-gray-200 focus:border-primary-600 focus:ring-primary-100'
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || loading}
                  className="absolute right-4 top-3 sm:top-3.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading || !formData.email || !formData.password}
              className="w-full px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  Admin Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="px-4 sm:px-8 py-3 sm:py-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200 space-y-3 sm:space-y-4">
            <p className="text-center text-gray-600 text-xs sm:text-sm">
              Not an admin?{' '}
              <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                User login
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500">
              <Link href="#" className="hover:text-primary-600 transition-colors">
                Forgot password?
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 sm:mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg text-center">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mx-auto mb-2" />
          <p className="text-xs text-primary-700">
            This is a secure admin portal. Only authorized administrators can access this area.
          </p>
        </div>
      </div>
    </div>
  );
}
