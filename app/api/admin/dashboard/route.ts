import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Get total users from profiles table
    const { count: totalUsers } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get braiders
    const { count: totalBraiders } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'braider');

    // Get customers
    const { count: totalCustomers } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // Get conversations
    const { count: totalConversations } = await serviceSupabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Get active conversations
    const { count: activeConversations } = await serviceSupabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get bookings
    const { count: totalBookings } = await serviceSupabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // Get total revenue
    const { data: payments } = await serviceSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get pending payments
    const { count: pendingPayments } = await serviceSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get recent bookings (last 5)
    const { data: recentBookings } = await serviceSupabase
      .from('bookings')
      .select('id, customer_name, status, appointment_date, total_amount')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalBraiders: totalBraiders || 0,
      totalCustomers: totalCustomers || 0,
      totalConversations: totalConversations || 0,
      activeConversations: activeConversations || 0,
      totalBookings: totalBookings || 0,
      totalRevenue: totalRevenue || 0,
      pendingPayments: pendingPayments || 0,
      recentBookings: recentBookings || [],
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
