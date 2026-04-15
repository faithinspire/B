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

    // Get total users (customers only)
    const { count: totalCustomers } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // Get total braiders from braider_profiles table (source of truth)
    const { count: totalBraiders } = await serviceSupabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true });

    // Get verified braiders
    const { count: verifiedBraiders } = await serviceSupabase
      .from('braider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    // Get pending verifications from braider_verification table
    const { count: pendingVerifications } = await serviceSupabase
      .from('braider_verification')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get active bookings
    const { count: activeBookings } = await serviceSupabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'in_progress']);

    // Get total revenue
    const { data: payments } = await serviceSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      totalUsers: (totalCustomers || 0) + (totalBraiders || 0),
      totalCustomers: totalCustomers || 0,
      totalBraiders: totalBraiders || 0,
      verifiedBraiders: verifiedBraiders || 0,
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
