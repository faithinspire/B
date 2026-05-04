/**
 * Email Service using Resend API
 * Handles all email communications for the BraidMe platform
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@braidme.com';

    if (!apiKey || apiKey.includes('your_resend_api_key')) {
      console.error('[emailService] ❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    if (!options.to || !options.to.includes('@')) {
      console.error('[emailService] ❌ Invalid email address:', options.to);
      return { success: false, error: 'Invalid email address' };
    }

    console.log('[emailService] Sending email to:', options.to);

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('[emailService] ❌ Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    const emailId = result.id || result.data?.id;
    if (!emailId) {
      console.error('[emailService] ❌ No email ID returned');
      return { success: false, error: 'Failed to send email' };
    }

    console.log('[emailService] ✅ Email sent successfully:', emailId);
    return { success: true, id: emailId };
  } catch (err) {
    console.error('[emailService] ❌ Error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send verification submission confirmation email
 */
export function buildVerificationSubmittedEmail(braiderName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✂️ BraidMe</h1>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 16px;">Verification Submitted Successfully! 🎉</h2>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Hi ${braiderName},
      </p>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Thank you for submitting your verification documents. We've received your submission and our team is reviewing your information.
      </p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">What happens next?</h3>
        <ul style="color: #6b7280; line-height: 1.8;">
          <li>Our admin team will review your documents within 24-48 hours</li>
          <li>You'll receive an email notification once your verification is approved or if we need more information</li>
          <li>Once approved, you'll have full access to all braider features</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        If you have any questions, please don't hesitate to contact our support team.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © 2026 BraidMe. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Send verification approved email
 */
export function buildVerificationApprovedEmail(braiderName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✂️ BraidMe</h1>
      </div>
      
      <h2 style="color: #10b981; margin-bottom: 16px;">🎉 Verification Approved!</h2>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Hi ${braiderName},
      </p>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Congratulations! Your verification has been approved. You now have full access to all BraidMe braider features.
      </p>
      
      <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0;">You can now:</h3>
        <ul style="color: #047857; line-height: 1.8;">
          <li>Accept and manage bookings from customers</li>
          <li>View your verified badge on your profile</li>
          <li>Access premium features and analytics</li>
          <li>Receive priority support</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        <a href="https://braidmee.vercel.app/braider/dashboard" style="color: #9333ea; text-decoration: none; font-weight: bold;">
          Go to your dashboard →
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © 2026 BraidMe. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Send verification rejected email
 */
export function buildVerificationRejectedEmail(braiderName: string, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✂️ BraidMe</h1>
      </div>
      
      <h2 style="color: #dc2626; margin-bottom: 16px;">Verification Status Update</h2>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Hi ${braiderName},
      </p>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Thank you for submitting your verification documents. Unfortunately, we were unable to approve your verification at this time.
      </p>
      
      ${reason ? `
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #7f1d1d; margin-top: 0;">Reason:</h3>
          <p style="color: #991b1b; margin: 0;">${reason}</p>
        </div>
      ` : ''}
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        You can resubmit your verification with updated documents. Please ensure all documents are clear, valid, and match the requirements.
      </p>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        If you have questions about why your verification was not approved, please contact our support team.
      </p>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        <a href="https://braidmee.vercel.app/braider/verify" style="color: #9333ea; text-decoration: none; font-weight: bold;">
          Resubmit verification →
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © 2026 BraidMe. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Send email confirmation email (for email verification)
 */
export function buildEmailConfirmationEmail(confirmationLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✂️ BraidMe</h1>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 16px;">Confirm Your Email Address</h2>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
        Thank you for signing up with BraidMe! Please confirm your email address to complete your registration.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmationLink}" 
           style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
          Confirm Email
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
        This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
      </p>
      
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Or copy this link: <a href="${confirmationLink}" style="color: #9333ea;">${confirmationLink}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © 2026 BraidMe. All rights reserved.
      </p>
    </div>
  `;
}
