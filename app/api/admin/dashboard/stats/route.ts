import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get total users
    const { count: totalUsers } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // Get total braiders
    const { count: totalBraiders } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'braider');

    // Get active bookings
    const { count: activeBookings } = await serviceSupabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'in_progress']);

    // Get pending verifications
    const { count: pendingVerifications } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'braider')
      .eq('verification_status', 'pending');

    // Get total revenue
    const { data: payments } = await serviceSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalBraiders: totalBraiders || 0,
      activeBookings: activeBookings || 0,
      pendingVerifications: pendingVerifications || 0,
      totalRevenue: totalRevenue || 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
