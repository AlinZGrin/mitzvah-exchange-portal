import { PrismaClient } from '@prisma/client'
import { safeConsoleError } from './error-utils'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  clientId: number
}

// Initialize client counter for tracking recreations
if (!globalForPrisma.clientId) {
  globalForPrisma.clientId = 0
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
  try {
    // Force disconnect existing client
    if (globalForPrisma.prisma) {
      globalForPrisma.prisma.$disconnect().catch(() => {
        // Ignore disconnect errors, we're creating a new client anyway
      })
    }
  } catch (error) {
    // Ignore any errors during disconnect
  }
  
  // Increment client ID to track recreations
  globalForPrisma.clientId = (globalForPrisma.clientId || 0) + 1
  
  // Create a completely new client instance
  const newClient = createPrismaClient()
  
  // Add a marker to the client for debugging
  Object.defineProperty(newClient, '_clientId', {
    value: globalForPrisma.clientId,
    writable: false,
    enumerable: false
  })
  
  // Update both global reference and exported variable
  globalForPrisma.prisma = newClient
  prisma = newClient
  
  safeConsoleError(`Created new Prisma client (ID: ${globalForPrisma.clientId})`)
  
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
  let recreationCount = 0;
  const maxRecreations = 2; // Limit client recreations to prevent infinite loops
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation(currentClient)
      return result
    } catch (error: any) {
      lastError = error;
      
      // Check for prepared statement or connection errors
      const isPreparedStatementError = error.message?.includes('prepared statement') || 
                                     error.code === 'P2024' || 
                                     error.code === '42P05' ||
                                     error.message?.includes('already exists');
      
      const isConnectionError = error.code === 'P1001' || 
                               error.message?.includes("Can't reach database") ||
                               error.message?.includes('ConnectorError');
      
      if ((isPreparedStatementError || isConnectionError) && recreationCount < maxRecreations) {
        safeConsoleError(`Database error detected (attempt ${attempt}/${maxRetries}, recreation ${recreationCount + 1}/${maxRecreations}):`, error.code || error.message);
        
        // Force disconnect and recreate client
        try {
          await currentClient.$disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
        
        currentClient = recreatePrismaClient();
        recreationCount++;
        
        // For prepared statement errors, wait progressively longer
        const waitTime = isPreparedStatementError ? 200 + (attempt * 100) + (recreationCount * 200) : 100;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        if (attempt < maxRetries) {
          continue;
        }
      }
      
      // If it's the last attempt or a non-retryable error, sanitize and throw
      const sanitizedError = sanitizeError(error);
      safeConsoleError(`Database operation failed after ${attempt} attempts and ${recreationCount} recreations:`, sanitizedError);
      throw sanitizedError;
    }
  }
  
  // If we get here, all retries failed
  throw sanitizeError(lastError);
}

// For development, avoid creating multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
