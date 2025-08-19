import { NextRequest, NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma';
import { safeConsoleError } from '@/lib/error-utils';
import { sendUsernameReminderEmail } from '@/lib/email';

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
    if (user && user.profile?.displayName) {
      try {
        await sendUsernameReminderEmail(
          email, 
          user.profile.displayName,
          email // In this system, email IS the username
        );
        console.log(`Username reminder email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send username reminder email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Always return the same message for security
    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent you your username information.'
    });

  } catch (error) {
    safeConsoleError('Forgot username error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
