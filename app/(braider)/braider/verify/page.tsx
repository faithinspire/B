'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AlertCircle, CheckCircle, Clock, Upload, X, Eye, Download } from 'lucide-react';

type VerificationStep = 'info' | 'documents' | 'review' | 'submitted';
type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'not_started';

interface VerificationData {
  full_name: string;
  phone: string;
  location_country: string;
  location_state: string;
  location_city: string;
  years_experience: string;
  specialization: string;
  id_document_type: string;
  id_number: string;
  id_document_url?: string;
  selfie_url?: string;
}

export default function BraiderVerificationPage() {
  const router = useRouter();
  const { user } = useSupabaseAuthStore();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('info');
  const [status, setStatus] = useState<VerificationStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<VerificationData>({
    full_name: user?.full_name || '',
    phone: '',
    location_country: 'NG',
    location_state: '',
    location_city: '',
    years_experience: '',
    specialization: '',
    id_document_type: '',
    id_number: '',
  });

  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');

  // Fetch current verification status
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchVerificationStatus();
  }, [user, router]);

  const fetchVerificationStatus = async () => {
    try {
      // Get the auth token from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/braider/verification/status', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch verification status');
      }

      const data = await response.json();
      setStatus(data.status || 'not_started');
      if (data.verification) {
        setFormData(prev => ({
          ...prev,
          ...data.verification,
        }));
        if (data.verification.id_document_url) {
          setIdPreview(data.verification.id_document_url);
        }
        if (data.verification.selfie_url) {
          setSelfiePreview(data.verification.selfie_url);
        }
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    if (type === 'id') {
      setIdFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setIdPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setSelfiePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.phone || !formData.id_document_type || !formData.id_number) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      if (!idFile && !idPreview) {
        setError('ID document is required');
        setSubmitting(false);
        return;
      }

      // Upload ID document if new
      let idDocumentUrl = idPreview;
      if (idFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', idFile);
        formDataUpload.append('type', 'verification_id');

        const uploadRes = await fetch('/api/upload/verification-document', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload ID document');
        }

        const uploadData = await uploadRes.json();
        idDocumentUrl = uploadData.url;
      }

      // Upload selfie if provided
      let selfieUrl = selfiePreview;
      if (selfieFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selfieFile);
        formDataUpload.append('type', 'verification_selfie');

        const uploadRes = await fetch('/api/upload/verification-document', {
          method: 'POST',
          body: formDataUpload,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          selfieUrl = uploadData.url;
        }
      }

      // Submit verification
      const response = await fetch('/api/braider/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id_document_url: idDocumentUrl,
          selfie_url: selfieUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit verification');
      }

      setSuccess('Verification submitted successfully! An admin will review your documents within 24-48 hours.');
      setStatus('pending');
      setCurrentStep('submitted');
      setTimeout(() => {
        router.push('/braider/dashboard');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // If already verified
  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Verified</h1>
            <p className="text-gray-600 mb-6">Your account has been verified. You can now receive bookings!</p>
            <button
              onClick={() => router.push('/braider/dashboard')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If rejected
  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Verification Rejected</h1>
            <p className="text-gray-600 mb-6 text-center">Your verification was not approved. Please contact support for more information.</p>
            <button
              onClick={() => router.push('/braider/dashboard')}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If pending
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Verification Pending</h1>
            <p className="text-gray-600 mb-6 text-center">Your verification is under review. An admin will review your documents within 24-48 hours.</p>
            <button
              onClick={() => router.push('/braider/dashboard')}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
          <p className="text-gray-600">Complete your verification to start receiving bookings</p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8">
          {(['info', 'documents', 'review'] as const).map((step, idx) => (
            <div key={step} className="flex-1">
              <button
                onClick={() => setCurrentStep(step)}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  currentStep === step
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
              >
                {step === 'info' && 'Personal Info'}
                {step === 'documents' && 'Documents'}
                {step === 'review' && 'Review'}
              </button>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Personal Info Step */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  placeholder="Your phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    value={formData.location_state}
                    onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.location_city}
                    onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                  <select
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  >
                    <option value="">Select</option>
                    <option value="1">Less than 1 year</option>
                    <option value="2">1-2 years</option>
                    <option value="5">2-5 years</option>
                    <option value="10">5-10 years</option>
                    <option value="15">10+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  >
                    <option value="">Select</option>
                    <option value="box-braids">Box Braids</option>
                    <option value="cornrows">Cornrows</option>
                    <option value="twists">Twists</option>
                    <option value="locs">Locs</option>
                    <option value="weaves">Weaves</option>
                    <option value="natural-hair">Natural Hair Care</option>
                    <option value="extensions">Extensions</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('documents')}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Continue to Documents
              </button>
            </div>
          )}

          {/* Documents Step */}
          {currentStep === 'documents' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                <select
                  value={formData.id_document_type}
                  onChange={(e) => setFormData({ ...formData, id_document_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                >
                  <option value="">Select ID type</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID</option>
                  <option value="voters_card">Voter's Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                <input
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  placeholder="Your ID number"
                />
              </div>

              {/* ID Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Document *</label>
                {idPreview ? (
                  <div className="relative">
                    <img src={idPreview} alt="ID Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => {
                        setIdFile(null);
                        setIdPreview('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-600 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP (max 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'id')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Selfie Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selfie (Optional)</label>
                {selfiePreview ? (
                  <div className="relative">
                    <img src={selfiePreview} alt="Selfie Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => {
                        setSelfieFile(null);
                        setSelfiePreview('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-600 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP (max 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'selfie')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('info')}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('review')}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>

              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">{formData.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-lg font-semibold text-gray-900">{formData.location_city}, {formData.location_state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Specialization</p>
                  <p className="text-lg font-semibold text-gray-900">{formData.specialization}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  ✓ Your documents will be reviewed by our admin team within 24-48 hours. You'll receive a notification once your account is verified.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('documents')}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </div>
          )}

          {/* Submitted Step */}
          {currentStep === 'submitted' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Submitted Successfully</h2>
              <p className="text-gray-600">Your verification has been submitted. You'll be redirected to your dashboard shortly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
