import { NextRequest, NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma';
import { safeConsoleError } from '@/lib/error-utils';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Find user with matching email and verification token
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findFirst({
        where: {
          email,
          emailVerificationToken: token,
          emailVerified: false
        },
        include: {
          profile: true
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user as verified
    const verifiedUser = await withPrisma(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null // Clear the token
        },
        include: {
          profile: true
        }
      });
    });

    // Send welcome email
    try {
      if (verifiedUser.profile?.displayName) {
        await sendWelcomeEmail(email, verifiedUser.profile.displayName);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    console.log(`✅ Email verified for user: ${email}`);

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true
    });

  } catch (error) {
    safeConsoleError('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method for URL-based verification (clicking link in email)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=missing-params', request.url)
      );
    }

    // Find user with matching email and verification token
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findFirst({
        where: {
          email,
          emailVerificationToken: token,
          emailVerified: false
        },
        include: {
          profile: true
        }
      });
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=invalid-token', request.url)
      );
    }

    // Update user as verified
    const verifiedUser = await withPrisma(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null
        },
        include: {
          profile: true
        }
      });
    });

    // Send welcome email
    try {
      if (verifiedUser.profile?.displayName) {
        await sendWelcomeEmail(email, verifiedUser.profile.displayName);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log(`✅ Email verified for user: ${email}`);

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth/verify-email?success=true', request.url)
    );

  } catch (error) {
    safeConsoleError('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=server-error', request.url)
    );
  }
}
