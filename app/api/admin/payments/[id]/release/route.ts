import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status to released
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: 'released',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to release payment' }, { status: 500 });
    }

    // Create notification for braider
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: payment.braider_id,
        type: 'payment_released',
        title: 'Payment Ready',
        message: `Payment of $${payment.amount.toFixed(2)} is ready to be accepted`,
        data: { payment_id: paymentId, amount: payment.amount },
        read: false,
      });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Release payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
