'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@/lib/validations';
import { signupUser } from '@/lib/actions/signup-user';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AlertCircle, Shield } from 'lucide-react';

export default function AdminSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    admin_code: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name) newErrors.full_name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.admin_code) newErrors.admin_code = 'Admin code is required';
    if (formData.admin_code !== 'BRAIDME_ADMIN_2024') newErrors.admin_code = 'Invalid admin code';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const validated = signupSchema.parse({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: 'admin',
      });

      // Call signup API
      await signupUser({
        email: validated.email,
        password: validated.password,
        full_name: validated.full_name,
        role: 'admin',
      });

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize auth store - this will fetch the session and profile
      const authStore = useSupabaseAuthStore.getState();
      await authStore.initializeSession();

      // Wait for profile to be fully committed to database
      await new Promise(resolve => setTimeout(resolve, 1500));

      router.push('/admin');
    } catch (error: any) {
      const errorMsg = error.message || 'Sign up failed';
      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (errorMsg.includes('User already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-8 text-center animate-slide-down">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-serif font-bold text-white">Admin Access</h1>
            </div>
            <p className="text-gray-300">Restricted to authorized administrators only</p>
          </div>

          {/* Error Alert */}
          {(error) && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Warning Alert */}
          <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              This is a restricted area. You need a valid admin code to proceed.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-smooth text-base ${
                  errors.full_name ? 'border-red-500' : ''
                }`}
                placeholder="Admin Name"
              />
              {errors.full_name && <p className="text-xs text-red-600 mt-2">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-smooth text-base ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="admin@braidme.com"
              />
              {errors.email && <p className="text-xs text-red-600 mt-2">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-smooth text-base ${
                  errors.phone ? 'border-red-500' : ''
                }`}
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-2">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-smooth text-base ${
                  errors.password ? 'border-red-500' : ''
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-600 mt-2">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-smooth text-base ${
                  errors.confirmPassword ? 'border-red-500' : ''
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-2">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Code *</label>
              <input
                type="password"
                value={formData.admin_code}
                onChange={(e) => setFormData({ ...formData, admin_code: e.target.value })}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-smooth text-base ${
                  errors.admin_code ? 'border-red-500' : ''
                }`}
                placeholder="Enter admin code"
              />
              {errors.admin_code && <p className="text-xs text-red-600 mt-2">{errors.admin_code}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:shadow-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 text-center animate-slide-up">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-gray-800 font-semibold hover:text-gray-900 transition-smooth">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
