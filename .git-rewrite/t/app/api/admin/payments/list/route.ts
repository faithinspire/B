import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Fetch all payments
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (payErr) throw payErr;

    // Enrich with user names
    const enrichedPayments = await Promise.all(
      (payments || []).map(async (payment) => {
        // Get customer name
        const { data: customer } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', payment.customer_id)
          .single();

        // Get braider name
        const { data: braider } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', payment.braider_id)
          .single();

        return {
          ...payment,
          customer_name: customer?.full_name || 'Unknown',
          braider_name: braider?.full_name || 'Unknown',
        };
      })
    );

    return NextResponse.json(enrichedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
