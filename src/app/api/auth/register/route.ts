import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { JSONUtils } from '@/lib/types';

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
    const existingUser = await prisma.user.findUnique({
      where: { email }
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
    const user = await prisma.user.create({
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

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${emailVerificationToken}`);

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
