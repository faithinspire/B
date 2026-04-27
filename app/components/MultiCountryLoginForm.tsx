'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CountryCode, normalizePhoneNumber, validatePhoneNumber } from '@/lib/countries';
import { CountrySelector } from './CountrySelector';
import { PhoneInput } from './PhoneInput';
import { AlertCircle, Loader } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';

interface MultiCountryLoginFormProps {
  onSuccess?: () => void;
}

export function MultiCountryLoginForm({ onSuccess }: MultiCountryLoginFormProps) {
  const router = useRouter();
  const { signIn } = useSupabaseAuthStore();
  const [country, setCountry] = useState<CountryCode>('NG');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginMethod === 'email') {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
    } else {
      if (!phone.trim()) {
        setError('Phone number is required');
        return;
      }

      if (!validatePhoneNumber(phone, country)) {
        setError('Invalid phone number for selected country');
        return;
      }
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      if (loginMethod === 'phone') {
        // Use phone login endpoint
        const response = await fetch('/api/auth/login-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            phone_country: country,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Phone login failed');
          setLoading(false);
          return;
        }

        // Store session and user info
        if (data.session) {
          // Update auth store with user data
          useSupabaseAuthStore.setState({
            user: data.user,
            session: data.session,
          });
        }

        // Verify role
        if (data.user?.id) {
          try {
            const verifyResponse = await fetch('/api/auth/verify-role', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.user.id }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.action === 'updated' && verifyData.newRole) {
                useSupabaseAuthStore.setState({
                  user: { ...data.user, role: verifyData.newRole as 'customer' | 'braider' | 'admin' }
                });
              }
            }
          } catch (verifyErr) {
            console.warn('Role verification failed:', verifyErr);
          }
        }

        // Get updated user
        const { user: updatedUser } = useSupabaseAuthStore.getState();

        // Redirect based on role
        if (onSuccess) {
          onSuccess();
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get('redirect');
          
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            if (updatedUser?.role === 'braider') {
              router.push('/braider/dashboard');
            } else if (updatedUser?.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          }
        }
      } else {
        // Email login (existing logic)
        try {
          await signIn(email, password);

          await new Promise(resolve => setTimeout(resolve, 100));

          const { user } = useSupabaseAuthStore.getState();

          console.log('=== LOGIN FORM: User role after login ===', { role: user?.role, email: user?.email });

          if (user?.id) {
            try {
              console.log('=== LOGIN FORM: Verifying user role ===');
              const verifyResponse = await fetch('/api/auth/verify-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
              });

              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                console.log('=== LOGIN FORM: Role verification result ===', verifyData);

                if (verifyData.action === 'updated' && verifyData.newRole) {
                  console.log('=== LOGIN FORM: Role was updated, updating store ===', { newRole: verifyData.newRole });
                  useSupabaseAuthStore.setState({
                    user: { ...user, role: verifyData.newRole as 'customer' | 'braider' | 'admin' }
                  });
                }
              }
            } catch (verifyErr) {
              console.warn('=== LOGIN FORM: Role verification failed ===', verifyErr instanceof Error ? verifyErr.message : verifyErr);
            }
          }

          if (user?.role === 'customer' && user?.id) {
            console.log('=== LOGIN FORM: Role is customer, checking braider_profiles ===');
            const { data: braiderProfile } = await supabase
              .from('braider_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .single();
            
            if (braiderProfile) {
              console.log('=== LOGIN FORM: Found braider_profiles record, user is actually a braider ===');
              useSupabaseAuthStore.setState({
                user: { ...user, role: 'braider' }
              });
            }
          }

          const { user: updatedUser } = useSupabaseAuthStore.getState();

          if (onSuccess) {
            onSuccess();
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect');
            
            if (redirectTo) {
              console.log('=== LOGIN FORM: Redirecting to saved URL ===', redirectTo);
              router.push(redirectTo);
            } else {
              if (updatedUser?.role === 'braider') {
                console.log('=== LOGIN FORM: Redirecting braider to /braider/dashboard ===');
                router.push('/braider/dashboard');
              } else if (updatedUser?.role === 'admin') {
                console.log('=== LOGIN FORM: Redirecting admin to /admin ===');
                router.push('/admin');
              } else {
                console.log('=== LOGIN FORM: Redirecting customer to /dashboard ===');
                router.push('/dashboard');
              }
            }
          }
        } catch (signInError) {
          const errorMsg = signInError instanceof Error ? signInError.message : 'Login failed';
          setError(errorMsg);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Country Selector */}
      <CountrySelector
        value={country}
        onChange={setCountry}
        label="Select Your Country"
      />

      {/* Login Method Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            loginMethod === 'email'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            loginMethod === 'phone'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Phone
        </button>
      </div>

      {/* Email Input */}
      {loginMethod === 'email' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
            disabled={loading}
          />
        </div>
      )}

      {/* Phone Input */}
      {loginMethod === 'phone' && (
        <PhoneInput
          value={phone}
          onChange={setPhone}
          country={country}
          label="Phone Number"
          required
          disabled={loading}
        />
      )}

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password *
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Select your country first, then choose your preferred login method.
        </p>
      </div>
    </form>
  );
}
