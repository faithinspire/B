'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@/lib/validations';
import { signupUser } from '@/lib/actions/signup-user';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AlertCircle, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

export default function BraiderSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Professional Info
    bio: '',
    experience_years: '',
    specialties: [] as string[],
    
    // Step 3: Service Details
    travel_radius_miles: '10',
    is_mobile: true,
    salon_address: '',
    cities: [] as string[],
    
    // Step 4: Pricing
    service_name: '',
    service_price: '',
    service_duration: '60',
    
    // Step 5: Verification
    id_document_url: '',
    selfie_url: '',
    background_check_consent: false,
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const specialtyOptions = [
    'Box Braids',
    'Knotless',
    'Cornrows',
    'Locs',
    'Twists',
    'Kids Braids',
    'Wig Installation',
    'Hair Treatment',
  ];

  const cityOptions = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
    'Austin',
    'Jacksonville',
    'Fort Worth',
    'Columbus',
    'Charlotte',
    'San Francisco',
    'Indianapolis',
    'Seattle',
    'Denver',
    'Boston',
  ];

  const toggleCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

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
      if (!formData.bio) newErrors.bio = 'Bio is required';
      if (!formData.experience_years) newErrors.experience_years = 'Experience is required';
      if (formData.specialties.length === 0) newErrors.specialties = 'Select at least one specialty';
    }

    if (stepNum === 3) {
      if (!formData.travel_radius_miles) newErrors.travel_radius_miles = 'Travel radius is required';
      if (!formData.is_mobile && !formData.salon_address) newErrors.salon_address = 'Salon address is required';
      if (formData.cities.length === 0) newErrors.cities = 'Select at least one city';
    }

    if (stepNum === 4) {
      if (!formData.service_name) newErrors.service_name = 'Service name is required';
      if (!formData.service_price) newErrors.service_price = 'Price is required';
    }

    if (stepNum === 5) {
      if (!formData.id_document_url) newErrors.id_document_url = 'ID document is required';
      if (!formData.selfie_url) newErrors.selfie_url = 'Selfie is required';
      // Next of kin is optional - only validate if at least one field is filled
      const hasNextOfKin = formData.next_of_kin_name || formData.next_of_kin_phone || formData.next_of_kin_relationship;
      if (hasNextOfKin) {
        if (!formData.next_of_kin_name) newErrors.next_of_kin_name = 'Name is required if providing next of kin';
        if (!formData.next_of_kin_phone) newErrors.next_of_kin_phone = 'Phone is required if providing next of kin';
        if (!formData.next_of_kin_relationship) newErrors.next_of_kin_relationship = 'Relationship is required if providing next of kin';
      }
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
    if (!validateStep(5)) return;

    setLoading(true);
    setError(null);

    try {
      const validated = signupSchema.parse({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: 'braider',
      });
      
      // Call signup API
      await signupUser({
        email: validated.email,
        password: validated.password,
        full_name: validated.full_name,
        role: 'braider',
      });

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize auth store - this will fetch the session and profile
      const authStore = useSupabaseAuthStore.getState();
      await authStore.initializeSession();

      // Wait for profile to be fully committed to database
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to braider dashboard
      router.push('/braider/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-scale-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-6 animate-slide-down">
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Join as Braider</h1>
            <p className="text-primary-100">Step {step} of 5 - Start your earning journey</p>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pt-6">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    s <= step ? 'bg-primary-600' : 'bg-gray-200'
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
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`input-field text-lg transition-smooth ${errors.full_name ? 'border-red-500' : ''}`}
                    placeholder="Jane Braider"
                  />
                  {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`input-field text-lg ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="jane@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`input-field text-lg ${errors.phone ? 'border-red-500' : ''}`}
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
                    className={`input-field text-lg ${errors.password ? 'border-red-500' : ''}`}
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
                    className={`input-field text-lg ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Bio *</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className={`input-field text-lg ${errors.bio ? 'border-red-500' : ''}`}
                    placeholder="Tell customers about your experience and style..."
                    rows={4}
                  />
                  {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience *</label>
                  <select
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    className={`input-field text-lg ${errors.experience_years ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select experience level</option>
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                  {errors.experience_years && <p className="text-xs text-red-600 mt-1">{errors.experience_years}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Specialties *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {specialtyOptions.map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleSpecialty(specialty)}
                        className={`p-3 rounded-lg border-2 font-medium transition-all ${
                          formData.specialties.includes(specialty)
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                  {errors.specialties && <p className="text-xs text-red-600 mt-2">{errors.specialties}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Service Area */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Type *</label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_mobile: true })}
                      className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                        formData.is_mobile
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      📱 Mobile - I travel to customers
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_mobile: false })}
                      className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                        !formData.is_mobile
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      🏪 Salon - Customers come to me
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Radius (miles) *</label>
                  <input
                    type="number"
                    value={formData.travel_radius_miles}
                    onChange={(e) => setFormData({ ...formData, travel_radius_miles: e.target.value })}
                    className="input-field text-lg"
                    min="1"
                    max="100"
                  />
                </div>

                {!formData.is_mobile && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Salon Address *</label>
                    <input
                      type="text"
                      value={formData.salon_address}
                      onChange={(e) => setFormData({ ...formData, salon_address: e.target.value })}
                      className={`input-field text-lg ${errors.salon_address ? 'border-red-500' : ''}`}
                      placeholder="123 Main St, City, State"
                    />
                    {errors.salon_address && <p className="text-xs text-red-600 mt-1">{errors.salon_address}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Service Coverage Cities *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {cityOptions.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className={`p-2 rounded-lg border-2 font-medium text-sm transition-all ${
                          formData.cities.includes(city)
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  {errors.cities && <p className="text-xs text-red-600 mt-2">{errors.cities}</p>}
                  <p className="text-xs text-gray-600 mt-2">Selected: {formData.cities.length} cities</p>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name *</label>
                  <input
                    type="text"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className={`input-field text-lg ${errors.service_name ? 'border-red-500' : ''}`}
                    placeholder="e.g., Box Braids Full Head"
                  />
                  {errors.service_name && <p className="text-xs text-red-600 mt-1">{errors.service_name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
                    <input
                      type="number"
                      value={formData.service_price}
                      onChange={(e) => setFormData({ ...formData, service_price: e.target.value })}
                      className={`input-field text-lg ${errors.service_price ? 'border-red-500' : ''}`}
                      placeholder="50"
                      min="0"
                      step="0.01"
                    />
                    {errors.service_price && <p className="text-xs text-red-600 mt-1">{errors.service_price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes) *</label>
                    <input
                      type="number"
                      value={formData.service_duration}
                      onChange={(e) => setFormData({ ...formData, service_duration: e.target.value })}
                      className="input-field text-lg"
                      placeholder="60"
                      min="15"
                      max="480"
                    />
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-sm text-primary-700">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    You can add more services after signing up
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Verification */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700 font-semibold mb-2">Verification & Security</p>
                  <p className="text-xs text-blue-600">
                    We verify all braiders to ensure platform safety. Your documents are encrypted and secure.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ID Document *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData({ ...formData, id_document_url: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="id-upload"
                    />
                    <label htmlFor="id-upload" className="cursor-pointer">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        {formData.id_document_url ? '✓ ID Uploaded' : 'Upload ID Document'}
                      </p>
                      <p className="text-xs text-gray-500">Driver's License, Passport, or National ID</p>
                    </label>
                  </div>
                  {errors.id_document_url && <p className="text-xs text-red-600 mt-1">{errors.id_document_url}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Selfie *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData({ ...formData, selfie_url: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="selfie-upload"
                    />
                    <label htmlFor="selfie-upload" className="cursor-pointer">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        {formData.selfie_url ? '✓ Selfie Uploaded' : 'Upload Selfie'}
                      </p>
                      <p className="text-xs text-gray-500">Clear photo of your face</p>
                    </label>
                  </div>
                  {errors.selfie_url && <p className="text-xs text-red-600 mt-1">{errors.selfie_url}</p>}
                </div>

                {/* Next of Kin Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Next of Kin (Emergency Contact) - Optional</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.next_of_kin_name}
                      onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
                      className={`input-field text-lg ${errors.next_of_kin_name ? 'border-red-500' : ''}`}
                      placeholder="Jane Doe"
                    />
                    {errors.next_of_kin_name && <p className="text-xs text-red-600 mt-1">{errors.next_of_kin_name}</p>}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.next_of_kin_phone}
                      onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
                      className={`input-field text-lg ${errors.next_of_kin_phone ? 'border-red-500' : ''}`}
                      placeholder="+1 (555) 000-0000"
                    />
                    {errors.next_of_kin_phone && <p className="text-xs text-red-600 mt-1">{errors.next_of_kin_phone}</p>}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                    <select
                      value={formData.next_of_kin_relationship}
                      onChange={(e) => setFormData({ ...formData, next_of_kin_relationship: e.target.value })}
                      className={`input-field text-lg ${errors.next_of_kin_relationship ? 'border-red-500' : ''}`}
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

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="background-check"
                    checked={formData.background_check_consent}
                    onChange={(e) => setFormData({ ...formData, background_check_consent: e.target.checked })}
                    className="mt-1"
                  />
                  <label htmlFor="background-check" className="text-sm text-gray-700">
                    <span className="font-semibold">Optional: Background Check</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Customers trust verified braiders more. A background check increases your bookings.
                    </p>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
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
              <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-smooth">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
