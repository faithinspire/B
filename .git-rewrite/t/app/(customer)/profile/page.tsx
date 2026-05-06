'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Mail, Phone, MapPin, Edit2, Save, X, Loader } from 'lucide-react';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useSupabaseAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check if user is authenticated and is a customer
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'customer') {
      router.push('/');
      return;
    }

    // Update form data when user loads
    setFormData(prev => ({
      ...prev,
      full_name: user.full_name || '',
      email: user.email || '',
    }));
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (!user || user.role !== 'customer') {
    return null;
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">My Profile</h1>
          <p className="text-primary-100">Manage your account information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 animate-fade-in cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setShowDetails(true)}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">{user.full_name}</h2>
              <p className="text-gray-600">Customer Account • Click to view full details</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                }}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <Mail className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <Phone className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{formData.phone || 'Not added'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{formData.address || 'Not added'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-3xl shadow-lg p-8 animate-slide-up">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h3>
          <div className="space-y-3">
            <button className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-smooth font-semibold">
              Change Password
            </button>
            <button className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-smooth font-semibold">
              Notification Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-smooth font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Full Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Full Profile Details</h2>
              <button onClick={() => setShowDetails(false)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Full Name</p>
                  <p className="text-lg text-gray-900">{user.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Phone</p>
                  <p className="text-lg text-gray-900">{formData.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Role</p>
                  <p className="text-lg text-gray-900 capitalize">{user.role}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                <p className="text-lg text-gray-900">{formData.address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Bio</p>
                <p className="text-lg text-gray-900">{formData.bio || 'No bio added'}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
