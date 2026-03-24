import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const { phone_number } = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json({ error: 'Twilio not configured' }, { status: 503 });
    }

    const client = twilio(accountSid, authToken);

    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: phone_number,
        channel: 'sms',
      });

    return NextResponse.json({
      success: true,
      sid: verification.sid,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
