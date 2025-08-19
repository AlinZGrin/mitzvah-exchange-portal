import { NextRequest, NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma';
import { safeConsoleError } from '@/lib/error-utils';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
      });
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Generate password reset token (expires in 1 hour)
      const resetToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await withPrisma(async (prisma) => {
        return await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: resetToken,
            passwordResetExpiry: resetTokenExpiry
          }
        });
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(
          email, 
          resetToken, 
          user.profile?.displayName || 'User'
        );
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Always return the same message for security
    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    });

  } catch (error) {
    safeConsoleError('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
