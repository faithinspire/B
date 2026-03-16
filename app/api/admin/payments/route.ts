import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get query parameters
    const admin_id = searchParams.get('admin_id');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate admin_id
    if (!admin_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: admin_id' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Parse and validate limit
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
        return NextResponse.json(
          { error: 'Limit must be between 1 and 500' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Parse and validate offset
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'Offset must be >= 0' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Build query
    let query = serviceSupabase
      .from('payment_notifications')
      .select('*', { count: 'exact' })
      .eq('admin_id', admin_id);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply ordering and pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching payment notifications:', error);
      return NextResponse.json(
        { error: `Failed to fetch payment notifications: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('Admin payments API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch payment notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
