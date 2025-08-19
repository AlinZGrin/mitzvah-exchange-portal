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

// Enhanced connection handling for serverless with retry logic
export async function withPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try to ping the database first
      await prisma.$connect()
      const result = await operation(prisma)
      return result
    } catch (error: any) {
      lastError = error;
      
      // If it's a prepared statement error, try to disconnect and reconnect
      if (error.message?.includes('prepared statement') || error.code === 'P2024') {
        console.log('Detected prepared statement conflict, reconnecting...')
        await prisma.$disconnect()
        await prisma.$connect()
        continue;
      }
      
      // If it's a connection error and we have retries left, wait and retry
      if ((error.code === 'P1001' || error.message?.includes("Can't reach database")) && attempt < maxRetries) {
        console.log(`Database connection failed (attempt ${attempt}/${maxRetries}), retrying in ${attempt}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        await prisma.$disconnect();
        continue;
      }
      
      // If it's the last attempt or a non-retryable error, sanitize and throw
      const sanitizedError = sanitizeError(error);
      throw sanitizedError;
    }
  }
  
  // If we get here, all retries failed
  throw sanitizeError(lastError);
}

// For development, avoid creating multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
