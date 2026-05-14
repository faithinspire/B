import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'BraidMe';
    const from = `${fromName} <${fromEmail}>`;

    console.log('[resend] Sending email from:', from);

    const result = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error('[resend] ❌ Failed to send email:', result.error);
      throw new Error(result.error.message);
    }

    console.log('[resend] ✅ Email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[resend] ❌ Failed to send email:', error);
    throw error;
  }
}
