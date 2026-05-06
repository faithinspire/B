import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, adminId } = await request.json();

    if (!paymentId || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status to completed
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Add to braider's available balance
    const { data: braiderProfile, error: profileError } = await supabase
      .from('braider_profiles')
      .select('available_balance')
      .eq('user_id', payment.braider_id)
      .single();

    if (!profileError && braiderProfile) {
      const newBalance = (braiderProfile.available_balance || 0) + payment.amount;
      await supabase
        .from('braider_profiles')
        .update({ available_balance: newBalance })
        .eq('user_id', payment.braider_id);
    }

    // Create audit log
    await supabase
      .from('payment_releases')
      .insert({
        payment_id: paymentId,
        admin_id: adminId,
        amount: payment.amount,
        braider_id: payment.braider_id,
        released_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Payment released successfully',
      payment: { ...payment, status: 'completed' },
    });
  } catch (error) {
    console.error('Payment release error:', error);
    return NextResponse.json(
      { error: 'Failed to release payment' },
      { status: 500 }
    );
  }
}
