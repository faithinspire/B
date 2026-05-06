'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export default function BraiderBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const supabase = db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: profile } = await supabase
      .from('braider_profiles').select('is_premium, blog_enabled').eq('id', user.id).single();
    setIsPremium(profile?.is_premium && profile?.blog_enabled);
    if (profile?.is_premium) {
      const res = await fetch(`/api/premium/blog?braider_id=${user.id}&all=1`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  async function togglePublish(post: any) {
    const res = await fetch('/api/premium/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, braider_id: userId, published: !post.published }),
    });
    if (res.ok) {
      setPosts(posts.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/premium/blog?id=${id}&braider_id=${userId}`, { method: 'DELETE' });
    setPosts(posts.filter(p => p.id !== id));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  );

  if (!isPremium) return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-3">Blog is a Premium Feature</h1>
        <p className="text-gray-600 mb-6">Upgrade to Premium to create and manage your blog posts.</p>
        <Link href="/braider/premium" className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all">
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/braider/dashboard" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Blog</h1>
              <p className="text-gray-500 text-sm">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link href="/braider/blog/new"
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-all">
            <Plus className="w-4 h-4" /> New Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 mb-4">No blog posts yet. Share your expertise!</p>
            <Link href="/braider/blog/new" className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-all">
              Write Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-4">
                {post.cover_image_url && (
                  <img src={post.cover_image_url} alt={post.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{post.content.substring(0, 120)}...</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>{post.views || 0} views</span>
                        {post.tags?.length > 0 && <span>{post.tags.join(', ')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(post)} title={post.published ? 'Unpublish' : 'Publish'}
                    className="p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                    {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <Link href={`/braider/blog/new?edit=${post.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => deletePost(post.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
