import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Status Views API - Track who viewed braider/barber status
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status_id = searchParams.get('status_id');

    if (!status_id) {
      return NextResponse.json(
        { error: 'Missing status_id' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: views, error } = await db
      .from('status_views')
      .select('*')
      .eq('status_id', status_id)
      .order('viewed_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: views || [],
      count: views?.length || 0,
    });
  } catch (error: any) {
    console.error('Get views error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { status_id, viewer_id } = body;

    if (!status_id || !viewer_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Check if already viewed
    const { data: existing } = await db
      .from('status_views')
      .select('id')
      .eq('status_id', status_id)
      .eq('viewer_id', viewer_id)
      .single();

    if (existing) {
      // Already viewed, just return success
      return NextResponse.json({
        success: true,
        message: 'Already viewed',
      });
    }

    // Record view
    const { data: view, error } = await db
      .from('status_views')
      .insert({
        status_id,
        viewer_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Update view count on status
    const { data: status } = await db
      .from('braider_status')
      .select('view_count')
      .eq('id', status_id)
      .single();

    if (status) {
      await db
        .from('braider_status')
        .update({ view_count: (status.view_count || 0) + 1 })
        .eq('id', status_id);
    }

    return NextResponse.json({
      success: true,
      data: view,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Record view error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record view' },
      { status: 500 }
    );
  }
}
