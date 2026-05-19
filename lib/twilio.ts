import twilio from 'twilio';

// Lazy-load Twilio client to avoid initialization errors during build
let twilioClient: ReturnType<typeof twilio> | null = null;
let initialized = false;

function initializeTwilio() {
  if (initialized) return;
  initialized = true;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken) {
    try {
      twilioClient = twilio(accountSid, authToken);
      console.log('[twilio] ✅ Client initialized successfully');
    } catch (error) {
      console.error('[twilio] ❌ Failed to initialize client:', error);
      twilioClient = null;
    }
  }
}

export interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS(options: SMSOptions) {
  try {
    initializeTwilio();

    if (!twilioClient) {
      throw new Error('Twilio is not configured. Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured. Missing TWILIO_PHONE_NUMBER');
    }

    console.log('[twilio] Sending SMS to:', options.to);

    const message = await twilioClient.messages.create({
      body: options.body,
      from: fromNumber,
      to: options.to,
    });

    console.log('[twilio] ✅ SMS sent successfully:', message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('[twilio] ❌ Failed to send SMS:', error);
    throw error;
  }
}

export function isTwilioConfigured(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  return !!(accountSid && authToken && fromNumber);
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has country code, add +
  if (cleaned.length >= 11 && !phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  // Return as-is if already formatted
  return phone.startsWith('+') ? phone : `+${phone}`;
}
