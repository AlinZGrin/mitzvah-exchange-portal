import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withPrisma } from '@/lib/prisma';
import { JSONUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, city } = await request.json();

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { email }
      });
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = Math.random().toString(36).substring(2, 15) + 
                                   Math.random().toString(36).substring(2, 15);

    // Create user and profile in a transaction
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerificationToken,
          profile: {
            create: {
              displayName,
              city: city || null,
              languages: JSONUtils.stringify([]),
              skills: JSONUtils.stringify([]),
              privacy: JSONUtils.stringify({
                showEmail: false,
                showPhone: false,
                showExactLocation: false
              })
            }
          }
        },
        include: {
          profile: true
        }
      });
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, emailVerificationToken, displayName);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      // Don't fail registration if email fails, just log it
      console.error('Failed to send verification email:', emailError);
    }

    // Return success (don't include password or token)
    const { password: _, emailVerificationToken: __, ...userWithoutSensitiveData } = user;

    return NextResponse.json({
      message: 'User created successfully. Please check your email for verification.',
      user: {
        ...userWithoutSensitiveData,
        profile: {
          ...user.profile,
          languages: JSONUtils.parseArray(user.profile?.languages || null),
          skills: JSONUtils.parseArray(user.profile?.skills || null),
          privacy: JSONUtils.parseObject(user.profile?.privacy || null, {})
        }
      }
    }, { status: 201 });

  } catch (error) {
    safeConsoleError('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
