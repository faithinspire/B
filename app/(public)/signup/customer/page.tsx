'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@/lib/validations';
import { signupUser } from '@/lib/actions/signup-user';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export default function CustomerSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    default_address: '',
    preferred_contact: 'email' as 'email' | 'sms' | 'in_app',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (stepNum: number) => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.full_name) newErrors.full_name = 'Name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (stepNum === 2) {
      if (!formData.default_address) newErrors.default_address = 'Address is required';
    }

    if (stepNum === 3) {
      if (!formData.next_of_kin_name) newErrors.next_of_kin_name = 'Next of kin name is required';
      if (!formData.next_of_kin_phone) newErrors.next_of_kin_phone = 'Next of kin phone is required';
      if (!formData.next_of_kin_relationship) newErrors.next_of_kin_relationship = 'Relationship is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setLoading(true);
    setError(null);

    try {
      const validated = signupSchema.parse({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: 'customer',
      });
      
      // Call signup API
      await signupUser({
        email: validated.email,
        password: validated.password,
        full_name: validated.full_name,
        role: 'customer',
      });

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize auth store - this will fetch the session and profile
      const authStore = useSupabaseAuthStore.getState();
      await authStore.initializeSession();

      // Wait for profile to be fully committed to database
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-scale-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-secondary-600 to-accent-600 px-8 py-6 animate-slide-down">
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Join as Customer</h1>
            <p className="text-secondary-100">Step {step} of 2 - Find your perfect braider</p>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pt-6">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    s <= step ? 'bg-secondary-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {(error) && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <p className="text-sm text-gray-600 mb-6">Step {step} of 3</p>
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.full_name ? 'border-red-500' : ''}`}
                    placeholder="John Doe"
                  />
                  {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Location & Preferences */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Default Address *</label>
                  <input
                    type="text"
                    value={formData.default_address}
                    onChange={(e) => setFormData({ ...formData, default_address: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.default_address ? 'border-red-500' : ''}`}
                    placeholder="123 Main St, City, State"
                  />
                  {errors.default_address && <p className="text-xs text-red-600 mt-1">{errors.default_address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Contact Method *</label>
                  <div className="space-y-3">
                    {(['email', 'sms', 'in_app'] as const).map((method, idx) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferred_contact: method })}
                        className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all animate-slide-up ${
                          formData.preferred_contact === method
                            ? 'border-secondary-600 bg-secondary-50 text-secondary-600'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {method === 'email' && '📧 Email'}
                        {method === 'sms' && '📱 SMS'}
                        {method === 'in_app' && '🔔 In-App Notifications'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 animate-slide-up">
                  <p className="text-sm text-secondary-700">
                    ✓ You can update your preferences anytime in settings
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Next of Kin (Security) */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    🔒 <strong>Security Information:</strong> We collect next of kin details for your safety and security.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Next of Kin Name *</label>
                  <input
                    type="text"
                    value={formData.next_of_kin_name}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.next_of_kin_name ? 'border-red-500' : ''}`}
                    placeholder="Jane Doe"
                  />
                  {errors.next_of_kin_name && <p className="text-xs text-red-600 mt-1">{errors.next_of_kin_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Next of Kin Phone *</label>
                  <input
                    type="tel"
                    value={formData.next_of_kin_phone}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.next_of_kin_phone ? 'border-red-500' : ''}`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.next_of_kin_phone && <p className="text-xs text-red-600 mt-1">{errors.next_of_kin_phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship *</label>
                  <select
                    value={formData.next_of_kin_relationship}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_relationship: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.next_of_kin_relationship ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.next_of_kin_relationship && <p className="text-xs text-red-600 mt-1">{errors.next_of_kin_relationship}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-smooth flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-smooth disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Complete Signup'}
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 text-center animate-slide-up">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-secondary-600 font-semibold hover:text-secondary-700 transition-smooth">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
