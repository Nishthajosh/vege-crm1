import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<void> {
  // Skip email sending if Resend is not configured
  if (!resend || !process.env.RESEND_API_KEY) {
    console.log('Resend not configured. Skipping verification email.');
    console.log('Verification token:', verificationToken);
    return;
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify your email address</h1>
          <p>Thank you for signing up! Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  // Skip email sending if Resend is not configured
  if (!resend || !process.env.RESEND_API_KEY) {
    console.log('Resend not configured. Skipping welcome email.');
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Welcome!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome${name ? `, ${name}` : ''}!</h1>
          <p>Your email has been verified and your account is now active.</p>
          <p>You can now log in and start using the platform.</p>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Log In
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error for welcome email - it's not critical
  }
}

