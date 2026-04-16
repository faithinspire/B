'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, TrendingUp, ShoppingBag, Star } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  rating_avg: number;
  rating_count: number;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

interface SalesAnalytics {
  total_sales: number;
  total_orders: number;
  total_revenue: number;
  average_rating: number;
}

export default function BraiderMarketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchProducts(user.id);
        fetchAnalytics(user.id);
      }
    });
  }, []);

  const fetchProducts = async (braider_id: string) => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('braider_id', braider_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (braider_id: string) => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await supabase
        .from('marketplace_sales_analytics')
        .select('*')
        .eq('braider_id', braider_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAnalytics(data || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600 mt-2">Sell products and accessories to customers</p>
            </div>
            <Link
              href="/braider/marketplace/add-product"
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₦{analytics.total_revenue?.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_orders}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.average_rating?.toFixed(1)}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_sales}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Start selling by adding your first product</p>
            <Link
              href="/braider/marketplace/add-product"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">Inactive</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-primary-600">₦{product.price?.toLocaleString()}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{product.rating_avg?.toFixed(1)}</span>
                      <span className="text-xs text-gray-600">({product.rating_count})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{product.stock_quantity} in stock</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{product.view_count} views</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/braider/marketplace/edit/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
