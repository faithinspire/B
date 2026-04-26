import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Braider Status API - 24-hour stories/status feature
 * - Max 3 statuses per braider
 * - Auto-delete after 24 hours
 * - Track views
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const braider_id = searchParams.get('braider_id');
    const viewer_id = searchParams.get('viewer_id');

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    let query = db
      .from('braider_status')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (braider_id) {
      query = query.eq('braider_id', braider_id);
    }

    const { data: statuses, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // If viewer_id provided, get view information
    if (viewer_id && statuses) {
      const statusIds = statuses.map((s: any) => s.id);
      const { data: views } = await db
        .from('status_views')
        .select('status_id')
        .eq('viewer_id', viewer_id)
        .in('status_id', statusIds);

      const viewedStatusIds = new Set(views?.map((v: any) => v.status_id) || []);

      return NextResponse.json({
        success: true,
        data: statuses.map((s: any) => ({
          ...s,
          viewed: viewedStatusIds.has(s.id),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: statuses || [],
    });
  } catch (error: any) {
    console.error('Get status error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { braider_id, media_url, media_type, caption } = body;

    if (!braider_id || !media_url) {
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

    // Check current status count for this braider
    const { data: existingStatuses, error: countError } = await db
      .from('braider_status')
      .select('id')
      .eq('braider_id', braider_id)
      .gt('expires_at', new Date().toISOString());

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to check status count' },
        { status: 400 }
      );
    }

    // If already 3 statuses, delete the oldest one
    if (existingStatuses && existingStatuses.length >= 3) {
      const { data: oldestStatus } = await db
        .from('braider_status')
        .select('id')
        .eq('braider_id', braider_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (oldestStatus) {
        await db.from('braider_status').delete().eq('id', oldestStatus.id);
      }
    }

    // Create new status
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: status, error } = await db
      .from('braider_status')
      .insert({
        braider_id,
        media_url,
        media_type: media_type || 'image',
        caption: caption || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: status,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create status error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status_id = searchParams.get('status_id');
    const braider_id = searchParams.get('braider_id');

    if (!status_id || !braider_id) {
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

    // Verify ownership
    const { data: status } = await db
      .from('braider_status')
      .select('braider_id')
      .eq('id', status_id)
      .single();

    if (!status || status.braider_id !== braider_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete status and associated views
    await db.from('status_views').delete().eq('status_id', status_id);
    const { error } = await db.from('braider_status').delete().eq('id', status_id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status deleted',
    });
  } catch (error: any) {
    console.error('Delete status error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete status' },
      { status: 500 }
    );
  }
}
