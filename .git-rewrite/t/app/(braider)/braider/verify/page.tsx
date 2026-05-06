'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { CheckCircle, Clock, AlertCircle, Upload, Download, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VerificationStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export default function BraiderVerify() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: 1, title: 'Profile Information', description: 'Your basic profile details', completed: false, required: true },
    { id: 2, title: 'ID Document', description: 'Upload a valid ID (Driver\'s License, Passport, or National ID)', completed: false, required: true },
    { id: 3, title: 'Selfie Verification', description: 'Take a selfie for identity verification', completed: false, required: true },
    { id: 4, title: 'Background Check', description: 'Optional background check consent', completed: false, required: false },
    { id: 5, title: 'Admin Review', description: 'Awaiting admin approval', completed: false, required: true },
  ]);
  const [showIdPreview, setShowIdPreview] = useState(false);
  const [showSelfiePreview, setShowSelfiePreview] = useState(false);

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load profile
  useEffect(() => {
    if (!user || user.role !== 'braider') return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('braider_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (err) throw err;
        setProfile(data);

        // Update steps based on profile data
        const newSteps = [...steps];
        newSteps[0].completed = !!data.full_name;
        newSteps[1].completed = !!data.id_document_url;
        newSteps[2].completed = !!data.selfie_url;
        newSteps[3].completed = !!data.background_check_consent;
        newSteps[4].completed = data.verification_status === 'verified';
        setSteps(newSteps);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      if (!supabase) throw new Error('Supabase not initialized');

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, WebP, or PDF');
      }

      // Upload to Supabase storage
      const fileName = `${user.id}/${docType}/${Date.now()}-${file.name}`;
      
      setUploadProgress(30);

      const { error: uploadErr } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      setUploadProgress(70);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      setUploadProgress(90);

      // Update braider profile with document URL
      const updateData: any = {};
      if (docType === 'id') {
        updateData.id_document_url = publicUrl;
      } else {
        updateData.selfie_url = publicUrl;
      }
      updateData.verification_status = 'pending';

      const { error: updateErr } = await supabase
        .from('braider_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateErr) throw updateErr;

      setUploadProgress(100);

      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('braider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
        
        // Update steps
        const newSteps = [...steps];
        if (docType === 'id') {
          newSteps[1].completed = true;
        } else {
          newSteps[2].completed = true;
        }
        setSteps(newSteps);
      }

      // Reset file input
      e.target.value = '';
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleBackgroundCheckConsent = async (consent: boolean) => {
    if (!user) return;

    try {
      setError('');

      if (!supabase) throw new Error('Supabase not initialized');

      const { error: updateErr } = await supabase
        .from('braider_profiles')
        .update({ background_check_consent: consent })
        .eq('user_id', user.id);

      if (updateErr) throw updateErr;

      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('braider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
        
        // Update steps
        const newSteps = [...steps];
        newSteps[3].completed = consent;
        setSteps(newSteps);
      }
    } catch (err) {
      console.error('Error updating background check:', err);
      setError(err instanceof Error ? err.message : 'Failed to update background check');
    }
  };

  if (authLoading || loading) {
    return (
      <BraiderPageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            <p className="text-gray-600 font-semibold">Loading verification...</p>
          </div>
        </div>
      </BraiderPageLayout>
    );
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  const verificationStatus = profile?.verification_status || 'unverified';
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <BraiderPageLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verification</h1>
          <p className="text-gray-600 text-sm sm:text-base">Complete your verification to start accepting bookings</p>
        </div>

        {/* Status Badge */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Verification Status</h2>
            {verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Verified
              </span>
            )}
            {verificationStatus === 'pending' && (
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-semibold">
                <Clock className="w-4 h-4" />
                Pending Review
              </span>
            )}
            {verificationStatus === 'unverified' && (
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Not Started
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">{completedSteps} of {steps.length} steps completed</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 sm:p-5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-900 font-semibold text-sm sm:text-base">Error</p>
              <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Steps */}
        <div className="space-y-4 sm:space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 border-l-4"
              style={{
                borderColor: step.completed ? '#10b981' : step.required ? '#f59e0b' : '#d1d5db',
              }}
            >
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base"
                    style={{
                      backgroundColor: step.completed ? '#10b981' : '#e5e7eb',
                      color: step.completed ? 'white' : '#6b7280',
                    }}
                  >
                    {step.completed ? <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6" /> : step.id}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{step.title}</h3>
                    {step.required && !step.completed && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4">{step.description}</p>

                  {/* Step-specific content */}
                  {step.id === 1 && (
                    <div className="bg-gray-50 rounded p-3 sm:p-4 text-xs sm:text-sm text-gray-700">
                      <p><strong>Name:</strong> {profile?.full_name || 'Not set'}</p>
                      <p className="mt-2"><strong>Email:</strong> {user?.email || 'Not set'}</p>
                      <p className="mt-2"><strong>Phone:</strong> {profile?.phone || 'Not set'}</p>
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="space-y-3">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'id')}
                          disabled={uploading}
                          className="hidden"
                          id="id-upload"
                        />
                        <label
                          htmlFor="id-upload"
                          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          <Upload className="w-4 sm:w-5 h-4 sm:h-5" />
                          {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload ID document'}
                        </label>
                      </label>
                      {profile?.id_document_url && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span className="text-xs sm:text-sm text-green-700 font-semibold">✓ ID document uploaded</span>
                          <button
                            onClick={() => setShowIdPreview(!showIdPreview)}
                            className="text-green-600 hover:text-green-700"
                          >
                            {showIdPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                      {showIdPreview && profile?.id_document_url && (
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <img src={profile.id_document_url} alt="ID Document" className="max-w-full h-auto rounded" />
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 3 && (
                    <div className="space-y-3">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDocumentUpload(e, 'selfie')}
                          disabled={uploading}
                          className="hidden"
                          id="selfie-upload"
                        />
                        <label
                          htmlFor="selfie-upload"
                          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 border-2 border-dashed border-accent-300 rounded-lg cursor-pointer hover:bg-accent-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          <Upload className="w-4 sm:w-5 h-4 sm:h-5" />
                          {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload selfie'}
                        </label>
                      </label>
                      {profile?.selfie_url && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span className="text-xs sm:text-sm text-green-700 font-semibold">✓ Selfie uploaded</span>
                          <button
                            onClick={() => setShowSelfiePreview(!showSelfiePreview)}
                            className="text-green-600 hover:text-green-700"
                          >
                            {showSelfiePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                      {showSelfiePreview && profile?.selfie_url && (
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <img src={profile.selfie_url} alt="Selfie" className="max-w-full h-auto rounded" />
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="background-check"
                        checked={profile?.background_check_consent || false}
                        onChange={(e) => handleBackgroundCheckConsent(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="background-check" className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                        I consent to a background check
                      </label>
                    </div>
                  )}

                  {step.id === 5 && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      {verificationStatus === 'verified' && (
                        <p className="text-green-600 font-semibold">✓ Your verification has been approved!</p>
                      )}
                      {verificationStatus === 'pending' && (
                        <p className="text-yellow-600 font-semibold">Your verification is under review. This usually takes 24-48 hours.</p>
                      )}
                      {verificationStatus === 'unverified' && (
                        <p className="text-gray-600">Complete the steps above to submit for verification.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {verificationStatus === 'unverified' && steps.slice(0, 3).every(s => s.completed) && (
          <div className="mt-8 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm sm:text-base text-green-700 mb-4">
              All required documents have been uploaded. Your verification is ready for admin review.
            </p>
            <button
              onClick={() => router.push('/braider/dashboard')}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-smooth"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </BraiderPageLayout>
  );
}
