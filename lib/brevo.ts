import axios from 'axios';

// Initialize Brevo API client
const brevoClient = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@braidme.com';
    const fromName = process.env.BREVO_FROM_NAME || 'BraidMe';

    console.log('[brevo] Sending email from:', `${fromName} <${fromEmail}>`);

    // Normalize recipient to array
    const recipients = Array.isArray(options.to)
      ? options.to.map(email => ({ email }))
      : [{ email: options.to }];

    const payload = {
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: recipients,
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || '',
      ...(options.replyTo && { replyTo: { email: options.replyTo } }),
    };

    const response = await brevoClient.post('/smtp/email', payload);

    if (response.status === 201 && response.data.messageId) {
      console.log('[brevo] ✅ Email sent successfully:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[brevo] ❌ Unexpected response:', response.data);
    throw new Error('Unexpected response from Brevo API');
  } catch (error) {
    console.error('[brevo] ❌ Failed to send email:', error);
    if (axios.isAxiosError(error)) {
      console.error('[brevo] Error details:', error.response?.data);
    }
    throw error;
  }
}
