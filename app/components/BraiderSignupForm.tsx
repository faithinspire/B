'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CountryCode, normalizePhoneNumber, validatePhoneNumber } from '@/lib/countries';
import { NIGERIAN_STATES, BRAIDING_SERVICES, IDENTIFICATION_TYPES, NigerianState } from '@/lib/nigerian-locations';
import { USA_STATES, USAState } from '@/lib/usa-locations';
import { CountrySelector } from './CountrySelector';
import { PhoneInput } from './PhoneInput';
import { AlertCircle, Loader, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface BraiderSignupFormProps {
  onSuccess?: () => void;
}

type SignupStep = 'basic' | 'location' | 'professional' | 'identification' | 'review';

export function BraiderSignupForm({ onSuccess }: BraiderSignupFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SignupStep>('basic');
  const [country, setCountry] = useState<CountryCode>('NG');
  
  // Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Location Info
  const [state, setState] = useState<NigerianState | USAState>('Lagos');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  
  // Next of Kin
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState('');
  
  // Professional Info
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  
  // Identification
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  
  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<SignupStep[]>([]);

  const steps: { id: SignupStep; label: string }[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'location', label: 'Location' },
    { id: 'professional', label: 'Professional' },
    { id: 'identification', label: 'Verification' },
    { id: 'review', label: 'Review' },
  ];

  const validateBasicInfo = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!validatePhoneNumber(phone, country)) {
      setError('Invalid phone number for selected country');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateLocation = () => {
    if (!state) {
      setError('State is required');
      return false;
    }
    if (!city.trim()) {
      setError('City/Town is required');
      return false;
    }
    if (!address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!nextOfKinName.trim()) {
      setError('Next of kin name is required');
      return false;
    }
    if (!nextOfKinPhone.trim()) {
      setError('Next of kin phone is required');
      return false;
    }
    if (!nextOfKinRelationship.trim()) {
      setError('Next of kin relationship is required');
      return false;
    }
    return true;
  };

  const validateProfessional = () => {
    if (!specialization) {
      setError('Specialization is required');
      return false;
    }
    if (!yearsExperience) {
      setError('Years of experience is required');
      return false;
    }
    if (selectedServices.length === 0) {
      setError('Select at least one service');
      return false;
    }
    if (!bio.trim()) {
      setError('Professional bio is required');
      return false;
    }
    return true;
  };

  const validateIdentification = () => {
    if (!idType) {
      setError('ID type is required');
      return false;
    }
    if (!idNumber.trim()) {
      setError('ID number is required');
      return false;
    }
    if (!idDocument) {
      setError('ID document is required');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (currentStep === 'basic' && !validateBasicInfo()) return;
    if (currentStep === 'location' && !validateLocation()) return;
    if (currentStep === 'professional' && !validateProfessional()) return;
    if (currentStep === 'identification' && !validateIdentification()) return;

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateIdentification()) return;

    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone, country);

      // Upload ID document - make it optional
      let idDocumentUrl = '';
      if (idDocument) {
        try {
          const formData = new FormData();
          formData.append('file', idDocument);
          formData.append('type', 'braider_id');

          const uploadRes = await fetch('/api/upload/braider-id', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            idDocumentUrl = uploadData.url;
          } else {
            const errorData = await uploadRes.json();
            console.warn('ID upload warning:', errorData.error);
            // Continue without URL - don't fail the signup
          }
        } catch (uploadErr) {
          console.warn('ID upload error:', uploadErr);
          // Continue without URL - don't fail the signup
        }
      }

      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: normalizedPhone,
          phone_country: country,
          country, // CRITICAL: explicit country — never let backend default to 'NG'
          password,
          role: 'braider',
          specialization,
          years_experience: parseInt(yearsExperience),
          services: selectedServices,
          bio,
          instagram_url: instagramHandle ? (instagramHandle.startsWith('http') ? instagramHandle : `https://instagram.com/${instagramHandle.replace('@', '')}`) : null,
          tiktok_url: tiktokHandle ? (tiktokHandle.startsWith('http') ? tiktokHandle : `https://tiktok.com/@${tiktokHandle.replace('@', '')}`) : null,
          state,
          city,
          address,
          id_type: idType,
          id_number: idNumber,
          id_document_url: idDocumentUrl,
          next_of_kin_name: nextOfKinName,
          next_of_kin_phone: nextOfKinPhone,
          next_of_kin_relationship: nextOfKinRelationship,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // CRITICAL: Ensure profile is created with correct role immediately after signup
      // This handles the case where the profile table hasn't replicated yet
      try {
        const ensureRes = await fetch('/api/auth/ensure-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email,
            fullName,
            role: 'braider',
          }),
        });

        if (!ensureRes.ok) {
          console.warn('Failed to ensure profile:', await ensureRes.json());
          // Continue anyway - profile might already exist
        } else {
          console.log('Profile ensured:', await ensureRes.json());
        }
      } catch (err) {
        console.warn('Ensure profile error:', err);
        // Continue anyway - profile might already exist
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/braider/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setIdDocument(e.target.files[0]);
    }
  };

  // Get states and cities based on country
  const statesList = country === 'NG' 
    ? Object.keys(NIGERIAN_STATES) as NigerianState[]
    : Object.keys(USA_STATES) as USAState[];
  
  const citiesList = country === 'NG'
    ? (state ? NIGERIAN_STATES[state as NigerianState] : [])
    : (state ? USA_STATES[state as USAState] : []);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => {
                const stepIdx = steps.findIndex(s => s.id === step.id);
                const currentIdx = steps.findIndex(s => s.id === currentStep);
                if (stepIdx < currentIdx || completedSteps.includes(step.id)) {
                  setCurrentStep(step.id);
                }
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                currentStep === step.id
                  ? 'bg-primary-600 text-white'
                  : completedSteps.includes(step.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {completedSteps.includes(step.id) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                idx + 1
              )}
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg p-6 space-y-4">
        {/* Basic Info Step */}
        {currentStep === 'basic' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <CountrySelector 
              value={country} 
              onChange={(newCountry) => {
                setCountry(newCountry);
                // Reset state and city when country changes
                setState(newCountry === 'NG' ? 'Lagos' : 'Alabama');
                setCity('');
              }} 
              label="Country" 
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <PhoneInput
              value={phone}
              onChange={setPhone}
              country={country}
              label="Phone Number"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>
          </>
        )}

        {/* Location Step */}
        {currentStep === 'location' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location & Emergency Contact</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value as NigerianState);
                  setCity('');
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              >
                {statesList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City/Town *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              >
                <option value="">Select a city/town</option>
                {citiesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your salon or home address"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <div className="border-t-2 border-gray-200 pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-4">Next of Kin (Emergency Contact)</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={nextOfKinName}
                  onChange={(e) => setNextOfKinName(e.target.value)}
                  placeholder="Emergency contact name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={nextOfKinPhone}
                  onChange={(e) => setNextOfKinPhone(e.target.value)}
                  placeholder="Emergency contact phone"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                <select
                  value={nextOfKinRelationship}
                  onChange={(e) => setNextOfKinRelationship(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Professional Step */}
        {currentStep === 'professional' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
              <select
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              >
                <option value="">Select experience level</option>
                <option value="1">Less than 1 year</option>
                <option value="2">1-2 years</option>
                <option value="5">2-5 years</option>
                <option value="10">5-10 years</option>
                <option value="15">10+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered * (Select at least one)</label>
              <div className="grid grid-cols-2 gap-2">
                {BRAIDING_SERVICES.map(service => (
                  <label key={service} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio *</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your experience, style, and what makes you unique..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Social Media (Optional)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Handle</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-primary-600 overflow-hidden">
                  <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">@</span>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="yourhandle"
                    className="flex-1 px-3 py-3 focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Handle</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-primary-600 overflow-hidden">
                  <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">@</span>
                  <input
                    type="text"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value)}
                    placeholder="yourhandle"
                    className="flex-1 px-3 py-3 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Identification Step */}
        {currentStep === 'identification' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verification Documents</h2>
            <p className="text-sm text-gray-600 mb-4">Upload a valid ID for verification. This helps us ensure trust and safety.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              >
                <option value="">Select ID type</option>
                {IDENTIFICATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Document *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-600 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  <p className="text-sm text-gray-600">
                    {idDocument ? idDocument.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF (max 5MB)</p>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Information</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {fullName}</p>
                <p className="text-sm text-gray-700"><strong>Email:</strong> {email}</p>
                <p className="text-sm text-gray-700"><strong>Phone:</strong> {phone}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-sm text-gray-700"><strong>State:</strong> {state}</p>
                <p className="text-sm text-gray-700"><strong>City:</strong> {city}</p>
                <p className="text-sm text-gray-700"><strong>Address:</strong> {address}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Next of Kin</h3>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {nextOfKinName}</p>
                <p className="text-sm text-gray-700"><strong>Phone:</strong> {nextOfKinPhone}</p>
                <p className="text-sm text-gray-700"><strong>Relationship:</strong> {nextOfKinRelationship}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Professional Details</h3>
                <p className="text-sm text-gray-700"><strong>Specialization:</strong> {specialization}</p>
                <p className="text-sm text-gray-700"><strong>Experience:</strong> {yearsExperience} years</p>
                <p className="text-sm text-gray-700"><strong>Services:</strong> {selectedServices.join(', ')}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  ✓ Your account will be pending verification. An admin will review your documents and approve your account within 24-48 hours.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 'basic' || loading}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {currentStep !== 'review' ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating Account...' : 'Complete Signup'}
          </button>
        )}
      </div>
    </div>
  );
}
