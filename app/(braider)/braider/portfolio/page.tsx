'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { BraiderPageLayout } from '@/app/components/BraiderPageLayout';
import { Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  braider_id: string;
}

export default function BraiderPortfolio() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load portfolio
  useEffect(() => {
    if (!user || user.role !== 'braider') return;

    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setError('');

        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('portfolio')
          .select('*')
          .eq('braider_id', user.id)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setPortfolio(data || []);
      } catch (err) {
        console.error('Error loading portfolio:', err);
        setError('Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError('');

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('userId', user.id);
      formDataUpload.append('title', formData.title || 'Portfolio Item');
      formDataUpload.append('description', formData.description || '');

      const response = await fetch('/api/upload/portfolio', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const newItem = await response.json();
      setPortfolio([newItem, ...portfolio]);
      setFormData({ title: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this portfolio item?')) return;

    try {
      setError('');

      if (!supabase) return;

      const { error: err } = await supabase
        .from('portfolio')
        .delete()
        .eq('id', itemId);

      if (err) throw err;
      setPortfolio(portfolio.filter(p => p.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  if (authLoading) {
    return <BraiderPageLayout title="Portfolio" subtitle="Showcase your work" loading children={null} />;
  }

  if (!user || user.role !== 'braider') {
    return null;
  }

  return (
    <BraiderPageLayout
      title="Portfolio"
      subtitle="Showcase your braiding work"
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
    >
      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Portfolio Item</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Box Braids with Beads"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe this work..."
              rows={2}
            />
          </div>

          <label className="block">
            <div className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer flex items-center gap-2 w-fit">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.length > 0 ? (
          portfolio.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-square bg-gray-100 overflow-hidden relative group">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                )}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{item.title || 'Portfolio Item'}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No portfolio items yet. Upload your first image to showcase your work.</p>
          </div>
        )}
      </div>
    </BraiderPageLayout>
  );
}
