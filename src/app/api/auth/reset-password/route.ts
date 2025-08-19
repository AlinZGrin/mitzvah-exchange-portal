import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withPrisma } from '@/lib/prisma';
import { safeConsoleError } from '@/lib/error-utils';

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user with matching email and valid reset token
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findFirst({
        where: {
          email,
          passwordResetToken: token,
          passwordResetExpiry: {
            gte: new Date() // Token hasn't expired
          }
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with new password and clear reset token
    await withPrisma(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null
        }
      });
    });

    console.log(`✅ Password reset successful for user: ${email}`);

    return NextResponse.json({
      message: 'Password reset successful. You can now sign in with your new password.'
    });

  } catch (error) {
    safeConsoleError('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
