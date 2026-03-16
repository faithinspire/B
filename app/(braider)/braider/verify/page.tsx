'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BraiderVerify() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

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

      if (!supabase) throw new Error('Supabase not initialized');

      // Upload to Supabase storage
      const fileName = `${user.id}/${docType}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

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

      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('braider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) setProfile(updatedProfile);
      setError(`${docType === 'id' ? 'ID' : 'Selfie'} uploaded successfully. Our team will review it shortly.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return <BraiderPageLayout title="Verification" subtitle="Verify your account" loading children={null} />;
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  const verificationStatus = profile?.verification_status || 'unverified';

  return (
    <BraiderPageLayout
      title="Verification"
      subtitle="Complete your account verification"
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
    >
      {/* Verification Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-4">
          {verificationStatus === 'verified' ? (
            <CheckCircle className="w-12 h-12 text-green-600" />
          ) : verificationStatus === 'pending' ? (
            <Clock className="w-12 h-12 text-yellow-600" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-600" />
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {verificationStatus === 'verified' ? 'Verified' :
               verificationStatus === 'pending' ? 'Pending Review' :
               'Not Verified'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {verificationStatus === 'verified' ? 'Your account is fully verified.' :
               verificationStatus === 'pending' ? 'Your documents are under review.' :
               'Complete verification to unlock all features.'}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Profile Information</h3>
              <p className="text-gray-600 text-sm mt-1">Complete your profile with accurate information.</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Upload ID Document</h3>
              <p className="text-gray-600 text-sm mt-1">Upload a valid government-issued ID for verification.</p>
              <label className="mt-3 inline-block">
                <div className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload ID'}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDocumentUpload(e, 'id')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {profile?.id_document_url && (
                <p className="text-xs text-green-600 mt-2">✓ ID document uploaded</p>
              )}
            </div>
            {profile?.id_document_url && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Upload Selfie</h3>
              <p className="text-gray-600 text-sm mt-1">Upload a clear selfie for identity verification.</p>
              <label className="mt-3 inline-block">
                <div className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Selfie'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDocumentUpload(e, 'selfie')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {profile?.selfie_url && (
                <p className="text-xs text-green-600 mt-2">✓ Selfie uploaded</p>
              )}
            </div>
            {profile?.selfie_url && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Background Check</h3>
              <p className="text-gray-600 text-sm mt-1">Optional: Complete a background check to increase customer trust.</p>
              <button className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-semibold">
                <Upload className="w-4 h-4" />
                Request Background Check
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Review & Approval</h3>
              <p className="text-gray-600 text-sm mt-1">Our team will review your documents and approve your account.</p>
            </div>
            {verificationStatus === 'verified' && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </BraiderPageLayout>
  );
}
