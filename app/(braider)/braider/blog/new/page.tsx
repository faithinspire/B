'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

function NewBlogPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');

  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', cover_image_url: '', tags: '', published: false });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { init(); }, []);

  async function init() {
    const supabase = db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    if (editId) {
      const res = await fetch(`/api/premium/blog?braider_id=${user.id}&all=1`);
      const posts = await res.json();
      const post = posts.find((p: any) => p.id === editId);
      if (post) setForm({ title: post.title, content: post.content, cover_image_url: post.cover_image_url || '', tags: (post.tags || []).join(', '), published: post.published });
    }
  }

  async function handleSave(publish?: boolean) {
    if (!userId || !form.title.trim() || !form.content.trim()) {
      setMsg('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        braider_id: userId,
        title: form.title,
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        published: publish !== undefined ? publish : form.published,
        ...(editId ? { id: editId } : {}),
      };
      const res = await fetch('/api/premium/blog', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/braider/blog');
      } else {
        const err = await res.json();
        setMsg(err.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/braider/blog" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Post' : 'New Blog Post'}</h1>
          </div>
          <button onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            <Eye className="w-4 h-4" /> {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {msg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{msg}</div>}

        {preview ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {form.cover_image_url && <img src={form.cover_image_url} alt="cover" className="w-full h-48 object-cover rounded-xl mb-6" />}
            <h1 className="text-3xl font-bold mb-4">{form.title || 'Untitled'}</h1>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{form.content}</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Your post title..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                <input value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your post content here..."
                  rows={16}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="braiding, natural hair, protective styles"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-60">
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-all disabled:opacity-60">
                {saving ? 'Saving...' : 'Publish Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewBlogPostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <NewBlogPostContent />
    </Suspense>
  );
}
