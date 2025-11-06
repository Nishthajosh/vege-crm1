import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await db.getUserByVerificationToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to mark email as verified
    await db.updateUser(user.id, {
      emailVerified: 1,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name || undefined);
    } catch (emailError) {
      // Log error but don't fail verification
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}

