'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { COUNTRIES, type CountryCode } from '@/lib/countries';

const CATEGORIES = [
  'Hair Extensions',
  'Wigs & Hairpieces',
  'Braiding Supplies',
  'Hair Care Products',
  'Accessories',
  'Styling Tools',
  'Protective Styles',
  'Premium Services',
  'Other Products',
];

const NIGERIAN_STATES = [
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Enugu', 'Benin City',
  'Katsina', 'Kaduna', 'Kogi', 'Kwara', 'Oyo', 'Osun', 'Ondo', 'Ekiti',
  'Delta', 'Rivers', 'Bayelsa', 'Cross River', 'Akwa Ibom', 'Calabar',
  'Abia', 'Imo', 'Ebonyi', 'Anambra', 'Nasarawa', 'Plateau', 'Taraba',
  'Adamawa', 'Yobe', 'Borno', 'Jigawa', 'Kebbi', 'Sokoto', 'Zamfara',
  'Niger', 'Gombe', 'Bauchi', 'Benue', 'Gusau', 'Zaria',
];

const USA_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia',
];

export default function AddProduct() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useSupabaseAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [country, setCountry] = useState<CountryCode>('NG');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    currency: 'NGN',
    stock_quantity: '',
    image_url: '',
    location_state: '',
    location_city: '',
  });

  // Resolve the auth token - try store first, then supabase session
  useEffect(() => {
    const resolveToken = async () => {
      // First try the stored token
      if (accessToken) {
        setResolvedToken(accessToken);
        return;
      }

      // Fall back to getting session from supabase client
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setResolvedToken(session.access_token);
          return;
        }
      }

      // No token found - redirect to login
      if (!authLoading) {
        router.push('/login');
      }
    };

    resolveToken();
  }, [accessToken, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    const countryConfig = COUNTRIES[newCountry];
    setFormData(prev => ({
      ...prev,
      currency: countryConfig.currency,
      location_state: '',
      location_city: '',
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const token = resolvedToken;
    if (!token) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch('/api/marketplace/upload-product-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setFormData(prev => ({ ...prev, image_url: data.data.imageUrl }));
      setSuccess('Image uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) { setError('Product name is required'); return; }
    if (!formData.category) { setError('Category is required'); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { setError('Valid price is required'); return; }
    if (!formData.location_state) { setError('State/Province is required'); return; }
    if (!formData.location_city.trim()) { setError('City is required'); return; }

    const token = resolvedToken;
    if (!token) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/marketplace/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          image_url: formData.image_url || null,
          country_code: country,
          location_state: formData.location_state,
          location_city: formData.location_city.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add product');
      }

      setSuccess('Product added successfully! Redirecting...');
      setTimeout(() => router.push('/braider/marketplace'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!resolvedToken && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Add New Product</h1>
          <p className="text-gray-600">Create a new product listing for the marketplace</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm font-semibold">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-8">
          {/* Country Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4">Selling Country *</label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {Object.entries(COUNTRIES).map(([code, config]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCountryChange(code as CountryCode)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    country === code
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{config.flag}</div>
                  <div className="text-sm font-semibold">{config.name}</div>
                  <div className="text-xs text-gray-600">{config.currency}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="e.g., Premium Hair Extensions"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              placeholder="Describe your product..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {country === 'NG' ? 'State' : 'State/Province'} *
              </label>
              <select
                name="location_state"
                value={formData.location_state}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="">Select state</option>
                {(country === 'NG' ? NIGERIAN_STATES : USA_STATES).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">City *</label>
              <input
                type="text"
                name="location_city"
                value={formData.location_city}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder={country === 'NG' ? 'e.g., Ikoyi' : 'e.g., New York'}
              />
            </div>
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Price ({COUNTRIES[country].currencySymbol}) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 sm:p-8 bg-purple-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>

            {formData.image_url && (
              <div className="mb-6">
                <img
                  src={formData.image_url}
                  alt="Product preview"
                  className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md"
                />
                <p className="text-sm text-green-600 mt-2 font-semibold">✓ Image uploaded</p>
              </div>
            )}

            <label className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors bg-white">
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin text-purple-600" />
                  <span className="text-purple-700 font-semibold">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{formData.image_url ? 'Change Image' : 'Upload Image'}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">Max 5MB. JPG, PNG, WebP supported.</p>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Adding...</>
              ) : (
                'Add Product'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
