import { writeFileSync, readFileSync } from 'fs';

// Read current file
const current = readFileSync('app/(braider)/braider/blog/new/page.tsx', 'utf8');

// Check if already has the wrapper
if (current.includes('export default function NewBlogPostPage')) {
  console.log('Already has wrapper export');
  process.exit(0);
}

// The complete fixed file
const fixed = `'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function NewBlogPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');

  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', cover_image_url: '', tags: '', published: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    db().auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
    if (editId) {
      db().from('blog_posts').select('*').eq('id', editId).single().then(({ data }) => {
        if (data) setForm({ title: data.title || '', content: data.content || '', cover_image_url: data.cover_image_url || '', tags: (data.tags || []).join(', '), published: data.published || false });
      });
    }
  }, [editId]);

  async function handleSave(e) {
    e.preventDefault();
    if (!userId) { setMsg('Not authenticated'); return; }
    setSaving(true); setMsg('');
    try {
      const payload = { title: form.title, content: form.content, cover_image_url: form.cover_image_url || null, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [], published: form.published, braider_id: userId };
      let error;
      if (editId) {
        ({ error } = await db().from('blog_posts').update(payload).eq('id', editId));
      } else {
        ({ error } = await db().from('blog_posts').insert(payload));
      }
      if (error) throw error;
      setMsg('Saved!');
      setTimeout(() => router.push('/braider/blog'), 1000);
    } catch (err) {
      setMsg(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/braider/blog" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Post' : 'New Blog Post'}</h1>
        </div>
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm" placeholder="Post title..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image URL (optional)</label>
            <input type="url" value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={12}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm resize-none" placeholder="Write your post..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm" placeholder="braiding, tips, styles" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="published" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="published" className="text-sm font-semibold text-gray-700 cursor-pointer">Publish immediately</label>
          </div>
          {msg && <p className={msg === 'Saved!' ? 'text-green-600 text-sm font-semibold' : 'text-red-600 text-sm'}>{msg}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : editId ? 'Update Post' : 'Save Post'}
            </button>
            <Link href="/braider/blog" className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" /> Cancel
            </Link>
          </div>
        </form>
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
`;

writeFileSync('app/(braider)/braider/blog/new/page.tsx', fixed, 'utf8');
console.log('Written. Size:', fixed.length);
