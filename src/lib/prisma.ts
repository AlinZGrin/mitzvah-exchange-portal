import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a function to get or create prisma client
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Helper function to sanitize error messages
function sanitizeError(error: any): any {
  if (error && typeof error === 'object') {
    const sanitized = { ...error };
    
    // Remove DATABASE_URL from error messages and stack traces
    if (sanitized.message && typeof sanitized.message === 'string') {
      sanitized.message = sanitized.message.replace(/postgresql:\/\/[^"'\s]+/g, '[DATABASE_URL_REDACTED]');
    }
    
    if (sanitized.stack && typeof sanitized.stack === 'string') {
      sanitized.stack = sanitized.stack.replace(/postgresql:\/\/[^"'\s]+/g, '[DATABASE_URL_REDACTED]');
    }
    
    // Handle nested errors
    if (sanitized.cause) {
      sanitized.cause = sanitizeError(sanitized.cause);
    }
    
    return sanitized;
  }
  
  return error;
}

// Enhanced connection handling for serverless
export async function withPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    // Try to ping the database first
    await prisma.$connect()
    const result = await operation(prisma)
    return result
  } catch (error: any) {
    // If it's a prepared statement error, try to disconnect and reconnect
    if (error.message?.includes('prepared statement') || error.code === 'P2024') {
      console.log('Detected prepared statement conflict, reconnecting...')
      await prisma.$disconnect()
      await prisma.$connect()
      const result = await operation(prisma)
      return result
    }
    
    // Sanitize error before re-throwing
    const sanitizedError = sanitizeError(error);
    throw sanitizedError;
  }
}

// For development, avoid creating multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
