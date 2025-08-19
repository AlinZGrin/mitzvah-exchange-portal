import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    let token: string | undefined;
    
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Bearer token, try to get from cookie
    if (!token) {
      token = request.cookies.get('auth-token')?.value;
    }
    
    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (!decoded.userId) {
      return null;
    }

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, user);
  };
}

export function requireRole(roles: string[], handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!roles.includes(user.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, user);
  };
}
