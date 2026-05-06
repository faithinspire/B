import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/premium/blog?braider_id=xxx  — list posts for a braider
// GET /api/premium/blog?slug=xxx&braider_id=xxx  — single post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const braider_id = searchParams.get('braider_id');
  const slug = searchParams.get('slug');
  const supabase = db();

  if (slug && braider_id) {
    const { data, error } = await supabase
      .from('braider_blog_posts')
      .select('*')
      .eq('braider_id', braider_id)
      .eq('slug', slug)
      .eq('published', true)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    // increment views
    await supabase.from('braider_blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
    return NextResponse.json(data);
  }

  if (braider_id) {
    const published = searchParams.get('all') !== '1';
    let query = supabase.from('braider_blog_posts').select('*').eq('braider_id', braider_id).order('created_at', { ascending: false });
    if (published) query = query.eq('published', true);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  return NextResponse.json({ error: 'braider_id required' }, { status: 400 });
}

// POST — create post
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { braider_id, title, content, cover_image_url, tags, published } = body;
  if (!braider_id || !title || !content) {
    return NextResponse.json({ error: 'braider_id, title, content required' }, { status: 400 });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const supabase = db();

  const { data, error } = await supabase.from('braider_blog_posts').insert({
    braider_id, title, slug, content,
    cover_image_url: cover_image_url || null,
    tags: tags || [],
    published: published || false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update post
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, braider_id, ...updates } = body;
  if (!id || !braider_id) return NextResponse.json({ error: 'id and braider_id required' }, { status: 400 });

  const supabase = db();
  const { data, error } = await supabase
    .from('braider_blog_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('braider_id', braider_id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete post
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const braider_id = searchParams.get('braider_id');
  if (!id || !braider_id) return NextResponse.json({ error: 'id and braider_id required' }, { status: 400 });

  const supabase = db();
  const { error } = await supabase.from('braider_blog_posts').delete().eq('id', id).eq('braider_id', braider_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
