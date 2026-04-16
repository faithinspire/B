'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Upload, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
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
  'Niger', 'Gombe', 'Bauchi', 'Benue', 'Gusau', 'Zaria', 'Katsina',
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
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [country, setCountry] = useState<CountryCode>('NG');
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
  const [imagePrompt, setImagePrompt] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

  const generateImage = async () => {
    if (!formData.name || !formData.category) {
      alert('Please fill in product name and category first');
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await fetch('/api/marketplace/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          category: formData.category,
          description: formData.description,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.imageUrl) {
        setFormData(prev => ({
          ...prev,
          image_url: data.data.imageUrl,
        }));
        alert('Image generated successfully!');
      } else {
        setImagePrompt(data.data.prompt);
        alert('Use the generated prompt with an AI image generator (DALL-E, Midjourney, etc.) and upload the image');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/marketplace/upload-product-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setFormData(prev => ({
        ...prev,
        image_url: data.data.imageUrl,
      }));

      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/marketplace/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          currency: formData.currency,
          stock_quantity: formData.stock_quantity,
          image_url: formData.image_url,
          country_code: country,
          location_state: formData.location_state,
          location_city: formData.location_city,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add product');
      }

      alert('Product added successfully!');
      router.push('/braider/marketplace');
    } catch (err) {
      console.error('Error adding product:', err);
      alert(`Failed to add product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Product</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Country *
              </label>
              <div className="flex gap-4">
                {Object.entries(COUNTRIES).map(([code, config]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleCountryChange(code as CountryCode)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      country === code
                        ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{config.flag}</div>
                    <div className="text-sm">{config.name}</div>
                    <div className="text-xs font-semibold">{config.currency}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="e.g., Premium Hair Extensions"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Describe your product..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {country === 'NG' ? 'State' : 'State/Province'} *
                </label>
                <select
                  name="location_state"
                  value={formData.location_state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  <option value="">Select {country === 'NG' ? 'state' : 'state'}</option>
                  {(country === 'NG' ? NIGERIAN_STATES : USA_STATES).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {country === 'NG' ? 'City' : 'City'} *
                </label>
                <input
                  type="text"
                  name="location_city"
                  value={formData.location_city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder={country === 'NG' ? 'e.g., Ikoyi' : 'e.g., New York'}
                />
              </div>
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ({COUNTRIES[country].currencySymbol}) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Image Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>

              {formData.image_url && (
                <div className="mb-4">
                  <img
                    src={formData.image_url}
                    alt="Product preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                {/* AI Image Generation */}
                <button
                  type="button"
                  onClick={generateImage}
                  disabled={generatingImage || !formData.name || !formData.category}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {generatingImage ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Image with AI
                    </>
                  )}
                </button>

                {imagePrompt && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Use this prompt with an AI image generator:</p>
                    <p className="text-sm text-gray-900 font-mono bg-white p-2 rounded border border-blue-200">
                      {imagePrompt}
                    </p>
                  </div>
                )}

                {/* Manual Upload */}
                <div>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary-600 transition-colors">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
