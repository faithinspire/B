import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS(options: SMSOptions) {
  try {
    if (!client) {
      console.error('[Twilio] ❌ Twilio not configured - missing credentials');
      throw new Error('Twilio is not configured');
    }

    if (!fromPhoneNumber) {
      console.error('[Twilio] ❌ Twilio phone number not configured');
      throw new Error('Twilio phone number is not configured');
    }

    console.log('[Twilio] Sending SMS to:', options.to);

    const message = await client.messages.create({
      body: options.body,
      from: fromPhoneNumber,
      to: options.to,
    });

    console.log('[Twilio] ✅ SMS sent successfully:', message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('[Twilio] ❌ Failed to send SMS:', error);
    throw error;
  }
}

export async function sendPasswordResetSMS(phone: string, resetLink: string) {
  try {
    const body = `Your BraidMe password reset link: ${resetLink}\n\nThis link expires in 1 hour. Do not share this link with anyone.`;

    return await sendSMS({
      to: phone,
      body,
    });
  } catch (error) {
    console.error('[Twilio] ❌ Failed to send password reset SMS:', error);
    throw error;
  }
}
