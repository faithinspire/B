import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Followers API - Following system for customers to follow braiders/barbers
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const follower_id = searchParams.get('follower_id');
    const following_id = searchParams.get('following_id');

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    let query = db.from('followers').select('*');

    if (follower_id) {
      query = query.eq('follower_id', follower_id);
    }

    if (following_id) {
      query = query.eq('following_id', following_id);
    }

    const { data: followers, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: followers || [],
    });
  } catch (error: any) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch followers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { follower_id, following_id } = body;

    if (!follower_id || !following_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (follower_id === following_id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Check if already following
    const { data: existing } = await db
      .from('followers')
      .select('id')
      .eq('follower_id', follower_id)
      .eq('following_id', following_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already following' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const { data: follow, error } = await db
      .from('followers')
      .insert({
        follower_id,
        following_id,
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
      data: follow,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create follow error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to follow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const follower_id = searchParams.get('follower_id');
    const following_id = searchParams.get('following_id');

    if (!follower_id || !following_id) {
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

    const { error } = await db
      .from('followers')
      .delete()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unfollowed',
    });
  } catch (error: any) {
    console.error('Delete follow error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to unfollow' },
      { status: 500 }
    );
  }
}
