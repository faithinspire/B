'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { Plus, Trash2, Upload, Instagram, Play, Image as ImageIcon, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  title?: string;
  description?: string;
}

const TikTokIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

const BARBER_CATEGORIES = ['fade', 'cut', 'beard', 'waves', 'dreadlocks', 'lineup', 'other'];
const BRAIDER_CATEGORIES = ['braids', 'twists', 'locs', 'weaves', 'natural', 'other'];

export default function BraiderServices() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [services, setServices] = useState<Service[]>([]);
  const [portfolioMedia, setPortfolioMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'media' | 'social'>('services');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'braids',
    duration_minutes: 60,
    price: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [socialLinks, setSocialLinks] = useState({ instagram: '', tiktok: '' });
  const [savingSocial, setSavingSocial] = useState(false);
  const [professionType, setProfessionType] = useState('braider');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'braider') return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (!supabase) return;

      // Load services
      const { data: svcData } = await supabase
        .from('services')
        .select('*')
        .eq('braider_id', user!.id)
        .order('created_at', { ascending: false });
      setServices(svcData || []);

      // Load braider profile for media + social + profession_type
      const { data: profile } = await supabase
        .from('braider_profiles')
        .select('portfolio_media, instagram_url, tiktok_url, specialization, profession_type')
        .eq('user_id', user!.id)
        .single();

      if (profile) {
        setPortfolioMedia(profile.portfolio_media || []);
        setSocialLinks({
          instagram: profile.instagram_url || '',
          tiktok: profile.tiktok_url || '',
        });
        // Detect profession type
        const pt = profile.profession_type || (profile.specialization?.startsWith('barber:') ? 'barber' : 'braider');
        setProfessionType(pt);
        setFormData(prev => ({ ...prev, category: pt === 'barber' ? 'fade' : 'braids' }));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSubmitting(true);
      setError('');
      const response = await fetch('/api/services/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ braider_id: user.id, ...formData, is_active: true }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add service');
      }
      const newService = await response.json();
      setServices([newService, ...services]);
      setFormData({ name: '', description: '', category: professionType === 'barber' ? 'fade' : 'braids', duration_minutes: 60, price: 0 });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      if (!supabase) return;
      await supabase.from('services').delete().eq('id', serviceId);
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingMedia(true);
      setError('');
      const isVideo = file.type.startsWith('video/');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('userId', user.id);
      formDataUpload.append('title', mediaTitle || file.name);
      formDataUpload.append('description', mediaDesc || '');

      const response = await fetch('/api/upload/portfolio', { method: 'POST', body: formDataUpload });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }
      const result = await response.json();
      const newItem: MediaItem = {
        url: result.image_url || result.url,
        type: isVideo ? 'video' : 'image',
        title: mediaTitle || file.name,
        description: mediaDesc,
      };

      // Update portfolio_media in braider_profiles
      const updatedMedia = [newItem, ...portfolioMedia];
      if (supabase) {
        await supabase
          .from('braider_profiles')
          .update({ portfolio_media: updatedMedia })
          .eq('user_id', user.id);
      }
      setPortfolioMedia(updatedMedia);
      setMediaTitle('');
      setMediaDesc('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (index: number) => {
    if (!confirm('Remove this media item?') || !supabase) return;
    const updated = portfolioMedia.filter((_, i) => i !== index);
    await supabase.from('braider_profiles').update({ portfolio_media: updated }).eq('user_id', user!.id);
    setPortfolioMedia(updated);
  };

  const handleSaveSocial = async () => {
    if (!supabase || !user) return;
    try {
      setSavingSocial(true);
      await supabase
        .from('braider_profiles')
        .update({
          instagram_url: socialLinks.instagram || null,
          tiktok_url: socialLinks.tiktok || null,
        })
        .eq('user_id', user.id);
    } catch (err) {
      setError('Failed to save social links');
    } finally {
      setSavingSocial(false);
    }
  };

  const categories = professionType === 'barber' ? BARBER_CATEGORIES : BRAIDER_CATEGORIES;

  if (authLoading) {
    return <BraiderPageLayout title="Services" subtitle="Manage your services" loading children={null} />;
  }
  if (!user || user.role !== 'braider') return null;

  return (
    <BraiderPageLayout
      title="Services & Portfolio"
      subtitle="Manage your services, media, and social links"
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {(['services', 'media', 'social'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'services' && `Services (${services.length})`}
            {tab === 'media' && `Portfolio Media (${portfolioMedia.length})`}
            {tab === 'social' && 'Social Links'}
          </button>
        ))}
      </div>

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add New Service
            </button>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow p-6 mb-6 border border-purple-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Service</h2>
              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder={professionType === 'barber' ? 'e.g., Skin Fade' : 'e.g., Box Braids'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Describe your service..." rows={2} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select required value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                      {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                    <input type="number" required min="15" value={formData.duration_minutes}
                      onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                    <input type="number" required min="0" step="0.01" value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-semibold">
                    {submitting ? 'Adding...' : 'Add Service'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {services.length > 0 ? services.map(service => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between border border-gray-100">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{service.name}</h3>
                  {service.description && <p className="text-gray-500 text-sm mt-0.5">{service.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span className="capitalize">{service.category}</span>
                    <span>{service.duration_minutes} min</span>
                    <span className="font-bold text-purple-600">${typeof service.price === 'number' ? service.price.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteService(service.id)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                No services yet. Add your first service above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEDIA TAB */}
      {activeTab === 'media' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-purple-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Photo or Video</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="e.g., Box Braids with Beads" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input type="text" value={mediaDesc} onChange={e => setMediaDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Brief description..." />
              </div>
              <label className="block">
                <div className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-2 w-fit text-sm font-semibold transition-colors ${uploadingMedia ? 'bg-gray-300 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                  <Upload className="w-4 h-4" />
                  {uploadingMedia ? 'Uploading...' : 'Upload Image or Video'}
                </div>
                <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={uploadingMedia} className="hidden" />
              </label>
              <p className="text-xs text-gray-400">Supports JPG, PNG, MP4, MOV. Max 50MB for videos.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolioMedia.length > 0 ? portfolioMedia.map((item, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                {item.type === 'video' ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <img src={item.url} alt={item.title || `Media ${i + 1}`} className="w-full h-full object-cover" />
                )}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{item.title}</p>
                  </div>
                )}
                <button onClick={() => handleDeleteMedia(i)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )) : (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No media uploaded yet. Show off your work!
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOCIAL TAB */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100 max-w-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Social Media Links</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Instagram className="w-4 h-4 text-pink-500" /> Instagram
              </label>
              <input type="text" value={socialLinks.instagram}
                onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                placeholder="@yourusername or full URL" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <TikTokIcon /> TikTok
              </label>
              <input type="text" value={socialLinks.tiktok}
                onChange={e => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                placeholder="@yourusername or full URL" />
            </div>
            <button onClick={handleSaveSocial} disabled={savingSocial}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-semibold">
              <Save className="w-4 h-4" />
              {savingSocial ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">These links will appear on your public profile so customers can follow your work.</p>
        </div>
      )}
    </BraiderPageLayout>
  );
}
