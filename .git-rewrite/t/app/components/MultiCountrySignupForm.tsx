'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CountryCode, normalizePhoneNumber, validatePhoneNumber } from '@/lib/countries';
import { CountrySelector } from './CountrySelector';
import { PhoneInput } from './PhoneInput';
import { AlertCircle, Loader } from 'lucide-react';

interface MultiCountrySignupFormProps {
  userType: 'customer' | 'braider' | 'admin';
  onSuccess?: () => void;
}

export function MultiCountrySignupForm({
  userType,
  onSuccess,
}: MultiCountrySignupFormProps) {
  const router = useRouter();
  const [country, setCountry] = useState<CountryCode>('NG');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Braider-specific fields
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [services, setServices] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(phone, country)) {
      setError('Invalid phone number for selected country');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Braider-specific validation
    if (userType === 'braider') {
      if (!specialization.trim()) {
        setError('Specialization is required');
        return;
      }
      if (!yearsExperience) {
        setError('Years of experience is required');
        return;
      }
      if (!services.trim()) {
        setError('Services offered is required');
        return;
      }
    }

    setLoading(true);

    try {
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phone, country);

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: normalizedPhone,
          phone_country: country,
          password,
          role: userType,
          // Braider-specific fields
          ...(userType === 'braider' && {
            specialization,
            years_experience: parseInt(yearsExperience),
            services,
            bio,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect based on user type
        const redirectMap = {
          customer: '/dashboard',
          braider: '/braider/dashboard',
          admin: '/admin',
        };
        router.push(redirectMap[userType]);
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

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
          disabled={loading}
        />
      </div>

      {/* Email */}
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

      {/* Phone Number */}
      <PhoneInput
        value={phone}
        onChange={setPhone}
        country={country}
        label="Phone Number"
        required
        disabled={loading}
      />

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
        <p className="text-xs text-gray-500 mt-1">
          At least 8 characters
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password *
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
          disabled={loading}
        />
      </div>

      {/* Braider-Specific Fields */}
      {userType === 'braider' && (
        <>
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Professional Information</h3>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization *
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
              disabled={loading}
            >
              <option value="">Select your specialization</option>
              <option value="box-braids">Box Braids</option>
              <option value="cornrows">Cornrows</option>
              <option value="twists">Twists</option>
              <option value="locs">Locs</option>
              <option value="weaves">Weaves</option>
              <option value="natural-hair">Natural Hair Care</option>
              <option value="extensions">Extensions</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience *
            </label>
            <select
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
              disabled={loading}
            >
              <option value="">Select experience level</option>
              <option value="1">Less than 1 year</option>
              <option value="2">1-2 years</option>
              <option value="5">2-5 years</option>
              <option value="10">5-10 years</option>
              <option value="15">10+ years</option>
            </select>
          </div>

          {/* Services Offered */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services Offered *
            </label>
            <textarea
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="List the services you offer (e.g., Box braids, Cornrows, Hair treatment)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell customers about your experience and style..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
              rows={3}
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Your phone number will be stored in international format and used for verification and communication.
        </p>
      </div>
    </form>
  );
}
