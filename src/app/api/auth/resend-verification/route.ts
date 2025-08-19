import { NextRequest, NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma';
import { safeConsoleError } from '@/lib/error-utils';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find unverified user
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findFirst({
        where: {
          email,
          emailVerified: false
        },
        include: {
          profile: true
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or already verified' },
        { status: 404 }
      );
    }

    // Generate new verification token
    const newToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);

    // Update user with new token
    await withPrisma(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: newToken }
      });
    });

    // Send new verification email
    try {
      await sendVerificationEmail(
        email, 
        newToken, 
        user.profile?.displayName || 'User'
      );
      
      console.log(`✅ Resent verification email to ${email}`);
      
      return NextResponse.json({
        message: 'Verification email sent successfully',
        success: true
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

  } catch (error) {
    safeConsoleError('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
