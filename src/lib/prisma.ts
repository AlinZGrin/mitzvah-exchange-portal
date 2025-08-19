import { PrismaClient } from '@prisma/client'
import { safeConsoleError } from './error-utils'

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

export let prisma = globalForPrisma.prisma ?? createPrismaClient()

// Function to recreate Prisma client (for prepared statement conflicts)
function recreatePrismaClient() {
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma.$disconnect().catch(() => {})
  }
  const newClient = createPrismaClient()
  globalForPrisma.prisma = newClient
  prisma = newClient
  return newClient
}

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
  let currentClient = prisma;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try to ping the database first
      await currentClient.$connect()
      const result = await operation(currentClient)
      return result
    } catch (error: any) {
      lastError = error;
      
      // If it's a prepared statement error, recreate the client entirely
      if (error.message?.includes('prepared statement') || error.code === 'P2024' || error.code === '42P05') {
        safeConsoleError('Detected prepared statement conflict, recreating client...');
        currentClient = recreatePrismaClient();
        
        // Wait a bit before retrying to avoid immediate conflicts
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      // If it's a connection error and we have retries left, wait and retry
      if ((error.code === 'P1001' || error.message?.includes("Can't reach database")) && attempt < maxRetries) {
        safeConsoleError(`Database connection failed (attempt ${attempt}/${maxRetries}), retrying in ${attempt}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        await currentClient.$disconnect();
        continue;
      }
      
      // If it's the last attempt or a non-retryable error, sanitize and throw
      const sanitizedError = sanitizeError(error);
      safeConsoleError(`Database operation failed after ${attempt} attempts:`, sanitizedError);
      throw sanitizedError;
    }
  }
  
  // If we get here, all retries failed
  throw sanitizeError(lastError);
}

// For development, avoid creating multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
