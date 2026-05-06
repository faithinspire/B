import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PaymentNotification {
  id: string;
  booking_id: string;
  payment_id: string;
  admin_id: string;
  customer_id: string;
  braider_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  notification_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

interface NotificationsResponse {
  notifications: PaymentNotification[];
  total: number;
  limit: number;
  offset: number;
}

// GET /api/admin/payments/notifications - Get all payment notifications for admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id');
    const status = searchParams.get('status') as 'pending' | 'completed' | 'failed' | null;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate required fields
    if (!adminId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: admin_id' },
        { status: 400 }
      );
    }

    // Validate admin_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adminId)) {
      return NextResponse.json(
        { error: 'Invalid admin_id format. Must be a valid UUID' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, completed, failed' },
        { status: 400 }
      );
    }

    // Parse and validate limit
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
        return NextResponse.json(
          { error: 'Invalid limit. Must be between 1 and 500' },
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
          { error: 'Invalid offset. Must be >= 0' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Build query
    let query = serviceSupabase
      .from('payment_notifications')
      .select('*', { count: 'exact' });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching payment notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment notifications' },
        { status: 500 }
      );
    }

    const response: NotificationsResponse = {
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Admin payments notifications error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch payment notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
