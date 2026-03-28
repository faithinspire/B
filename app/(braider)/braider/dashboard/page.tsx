'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { DollarSign, Calendar, Star, TrendingUp, Plus, Upload, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BraiderDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load dashboard data
  useEffect(() => {
    if (!user || user.role !== 'braider') return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!supabase) return;

        // Load braider profile
        const { data: profileData } = await supabase
          .from('braider_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Load services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('braider_id', user.id);

        if (servicesData) {
          setServices(servicesData);
        }

        // Load portfolio
        const { data: portfolioData } = await supabase
          .from('portfolio')
          .select('*')
          .eq('braider_id', user.id);

        if (portfolioData) {
          setPortfolio(portfolioData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingAvatar(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await response.json();
      setProfile({ ...profile, avatar_url: result.avatar_url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20" style={{ paddingTop: 0, marginTop: 0 }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4" style={{ paddingTop: '1.5rem' }}>
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-1 sm:mb-2">Welcome, {user.full_name}</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">Manage your braiding business</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Earnings</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600 mt-1 sm:mt-2">${typeof profile?.total_earnings === 'number' ? profile.total_earnings.toFixed(2) : '0.00'}</p>
              </div>
              <DollarSign className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-primary-100" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Bookings</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent-600 mt-1 sm:mt-2">0</p>
              </div>
              <Calendar className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-accent-100" />
            </div>
            <button
              onClick={() => router.push('/braider/bookings')}
              className="mt-3 sm:mt-4 w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-accent-50 text-accent-700 rounded-lg hover:bg-accent-100 transition-colors text-xs sm:text-sm font-semibold"
            >
              View Bookings
            </button>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Rating</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">{typeof profile?.rating_avg === 'number' ? profile.rating_avg.toFixed(1) : 'No ratings yet'}</p>
              </div>
              <Star className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-yellow-100" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Reviews</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{profile?.rating_count || 0}</p>
              </div>
              <TrendingUp className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-green-100" />
            </div>
          </div>
        </div>

        {/* Avatar Upload Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Profile Photo</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0]?.toUpperCase() || 'B'
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Upload a professional photo to help customers recognize you</p>
              <label className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer text-xs sm:text-sm font-semibold">
                <Upload className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Services ({services.length})</h3>
            <button
              onClick={() => router.push('/braider/services')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
            >
              <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Add Service
            </button>
          </div>
          {services.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {services.slice(0, 3).map((service) => (
                <div key={service.id} className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base">{service.name}</p>
                    <p className="text-xs text-gray-600">{service.duration_minutes} mins</p>
                  </div>
                  <p className="font-bold text-primary-600 text-xs sm:text-sm md:text-base">${typeof service.price === 'number' ? service.price.toFixed(2) : '0.00'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xs sm:text-sm">No services added yet</p>
          )}
        </div>

        {/* Portfolio Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Portfolio ({portfolio.length})</h3>
            <button
              onClick={() => router.push('/braider/portfolio')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
            >
              <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Add Photos
            </button>
          </div>
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {portfolio.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xs sm:text-sm">No portfolio items yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
