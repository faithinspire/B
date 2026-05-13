import nodemailer from 'nodemailer';

// Mailtrap configuration with API key
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  auth: {
    user: process.env.MAILTRAP_USER || 'ad4e934227c0808d8b8b029489fa0fa6',
    pass: process.env.MAILTRAP_PASS || 'ad4e934227c0808d8b8b029489fa0fa6',
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const result = await transporter.sendMail({
      from: process.env.MAILTRAP_FROM_EMAIL || 'noreply@braidme.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
