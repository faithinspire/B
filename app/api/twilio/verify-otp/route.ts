import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabaseAdmin } from '@/lib/supabase';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!;

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { phone_number, code, user_id } = await request.json();

    if (!phone_number || !code || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const verification = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: phone_number,
        code,
      });

    if (verification.status === 'approved') {
      // Update user profile
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
      }

      await supabaseAdmin
        .from('profiles')
        .update({
          phone: phone_number,
          phone_verified: true,
        })
        .eq('id', user_id);

      return NextResponse.json({
        success: true,
        message: 'Phone verified successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
