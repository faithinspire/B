'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, TrendingUp, ShoppingBag, Star, Loader, AlertCircle } from 'lucide-react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
  country_code?: string;
  stock_quantity: number;
  image_url: string | null;
  rating_avg: number;
  rating_count: number;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

export default function BraiderMarketplace() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/marketplace/products?braider_id=${user.id}&limit=50`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role === 'braider') {
      fetchProducts();
    }
  }, [user, authLoading, fetchProducts]);

  const deleteProduct = async (productId: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      setDeleting(productId);
      // Use the API route with service role
      const res = await fetch(`/api/marketplace/products/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      alert('Failed to delete product. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const getCurrencySymbol = (product: Product) => {
    if (product.country_code === 'US' || product.currency === 'USD') return '$';
    return '₦';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your store...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'braider') return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-4 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">🏪 My Store</h1>
            <p className="text-purple-100 text-sm">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
          </div>
          <Link
            href="/braider/marketplace/add-product"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-50 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold text-sm">Failed to load products</p>
              <p className="text-red-600 text-xs mt-1">{error}</p>
              <button onClick={fetchProducts} className="mt-2 text-xs text-red-600 underline">Try again</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!error && products.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 text-sm mb-6">Start selling hair accessories, extensions, and more to customers worldwide</p>
            <Link
              href="/braider/marketplace/add-product"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </Link>
          </div>
        )}

        {/* Products grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Inactive</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-gray-700">
                    {product.country_code === 'US' ? '🇺🇸' : '🇳🇬'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">{product.name}</h3>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-purple-600">
                      {getCurrencySymbol(product)}{(product.price || 0).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{(product.rating_avg || 0).toFixed(1)}</span>
                      <span>({product.rating_count || 0})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {product.stock_quantity} in stock
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {product.view_count || 0} views
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/braider/marketplace/edit/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={deleting === product.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-semibold disabled:opacity-50"
                    >
                      {deleting === product.id ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add more CTA */}
        {products.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/braider/marketplace/add-product"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Another Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
