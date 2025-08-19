import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { JSONUtils } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Prepare user data for response
    const { password: _, emailVerificationToken: __, ...userWithoutSensitiveData } = user;
    const responseUser = {
      ...userWithoutSensitiveData,
      profile: user.profile ? {
        ...user.profile,
        languages: JSONUtils.parseArray(user.profile.languages),
        skills: JSONUtils.parseArray(user.profile.skills),
        privacy: JSONUtils.parseObject(user.profile.privacy, {}),
        availability: JSONUtils.parseObject(user.profile.availability, {})
      } : null
    };

    // Set HTTP-only cookie with the token
    const response = NextResponse.json({
      message: 'Login successful',
      user: responseUser,
      token: token  // Add token to response for frontend
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('prepared statement') || error.message.includes('ConnectorError')) {
        console.error('Database connection error, retrying...');
        // Force disconnect and reconnect
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('Disconnect error:', disconnectError);
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
