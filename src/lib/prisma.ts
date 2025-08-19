import { PrismaClient } from '@prisma/client'
import { safeConsoleError } from './error-utils'

// Global singleton pattern for Prisma client
declare global {
  var __prisma: PrismaClient | undefined
  var __prismaClientId: number | undefined
  var __prismaLastRecreation: number | undefined
}

// Initialize tracking variables
if (!global.__prismaClientId) {
  global.__prismaClientId = 0
}
if (!global.__prismaLastRecreation) {
  global.__prismaLastRecreation = 0
}

// Create a function to get or create prisma client with connection pooling
function createPrismaClient(forceNewConnection: boolean = false) {
  let databaseUrl = process.env.DATABASE_URL;
  
  // For forced new connections, add a random parameter to ensure new connection pool
  if (forceNewConnection && databaseUrl) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    const randomId = Math.random().toString(36).substring(2, 15);
    databaseUrl = `${databaseUrl}${separator}connection_id=${randomId}`;
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

// Get or create the singleton Prisma client
function getPrismaClient(): PrismaClient {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient()
    global.__prismaClientId = (global.__prismaClientId || 0) + 1
    safeConsoleError(`Created initial Prisma client (ID: ${global.__prismaClientId})`)
  }
  return global.__prisma
}

export let prisma = getPrismaClient()

// Function to recreate Prisma client (for prepared statement conflicts)
async function recreatePrismaClient() {
  const now = Date.now()
  const timeSinceLastRecreation = now - (global.__prismaLastRecreation || 0)
  
  // Don't recreate too frequently (minimum 5 seconds between recreations)
  if (timeSinceLastRecreation < 5000 && (global.__prismaLastRecreation || 0) > 0) {
    safeConsoleError(`Skipping client recreation - too recent (${timeSinceLastRecreation}ms ago)`)
    return global.__prisma || getPrismaClient()
  }
  
  try {
    // Force disconnect existing client with proper cleanup
    if (global.__prisma) {
      safeConsoleError('Disconnecting existing Prisma client...')
      await global.__prisma.$disconnect()
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (error) {
    // Ignore any errors during disconnect
    safeConsoleError('Error during client disconnect:', error)
  }
  
  // Increment client ID to track recreations
  global.__prismaClientId = (global.__prismaClientId || 0) + 1
  global.__prismaLastRecreation = now
  
  // Create a completely new client instance with unique connection string
  const newClient = createPrismaClient(true) // Force new connection for conflicts
  
  // Add a marker to the client for debugging
  Object.defineProperty(newClient, '_clientId', {
    value: global.__prismaClientId,
    writable: false,
    enumerable: false
  })
  
  // Update global reference and exported variable
  global.__prisma = newClient
  prisma = newClient
  
  safeConsoleError(`Created new Prisma client (ID: ${global.__prismaClientId}) after ${timeSinceLastRecreation}ms`)
  
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
  let currentClient = getPrismaClient(); // Always start with the singleton
  let recreationCount = 0;
  const maxRecreations = 1; // Reduced to prevent connection exhaustion
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation(currentClient)
      return result
    } catch (error: any) {
      lastError = error;
      
      // Check for different types of errors
      const isPreparedStatementError = error.message?.includes('prepared statement') || 
                                     error.code === 'P2024' || 
                                     error.code === '42P05' ||
                                     error.message?.includes('already exists');
      
      const isConnectionError = error.code === 'P1001' || 
                               error.message?.includes("Can't reach database") ||
                               error.message?.includes('ConnectorError');
      
      const isMaxConnectionsError = error.message?.includes('Max client connections reached') ||
                                  error.message?.includes('too many clients') ||
                                  error.name === 'PrismaClientInitializationError';
      
      // Handle prepared statement errors with immediate recreation and longer wait
      if (isPreparedStatementError) {
        safeConsoleError(`Prepared statement conflict detected (attempt ${attempt}/${maxRetries}). Recreating client...`);
        
        // Always recreate for prepared statement conflicts, but limit frequency
        try {
          await currentClient.$disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
        
        // Wait longer for prepared statement conflicts to clear
        const waitTime = 2000 + (attempt * 1000); // 2-5 seconds
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Force create a completely new client
        currentClient = await recreatePrismaClient();
        
        if (attempt < maxRetries) {
          continue;
        }
      }
      // Handle max connections error with aggressive cleanup
      else if (isMaxConnectionsError) {
        safeConsoleError(`Max connections reached (attempt ${attempt}/${maxRetries}). Performing aggressive cleanup...`);
        
        // Force cleanup of current client
        try {
          await currentClient.$disconnect();
          safeConsoleError('Disconnected current client');
        } catch (disconnectError) {
          safeConsoleError('Error disconnecting client:', disconnectError);
        }
        
        // If we have retries left, wait longer and try with a fresh client
        if (attempt < maxRetries) {
          const waitTime = 3000 + (attempt * 2000); // Wait 3-7 seconds
          safeConsoleError(`Waiting ${waitTime}ms before retry with fresh client...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Force a fresh client (but don't count as recreation)
          global.__prisma = createPrismaClient(true); // Force new connection
          global.__prismaClientId = (global.__prismaClientId || 0) + 1;
          prisma = global.__prisma;
          currentClient = global.__prisma;
          
          safeConsoleError(`Created emergency client (ID: ${global.__prismaClientId}) due to connection exhaustion`);
          continue;
        }
      }
      // Handle other database errors with recreation
      else if (isConnectionError && recreationCount < maxRecreations) {
        safeConsoleError(`Database error detected (attempt ${attempt}/${maxRetries}, recreation ${recreationCount + 1}/${maxRecreations}):`, error.code || error.message);
        
        // Force disconnect and recreate client
        try {
          await currentClient.$disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
        
        currentClient = await recreatePrismaClient();
        recreationCount++;
        
        // Wait before retry
        const waitTime = 500 + (attempt * 250);
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

// Utility function for connection cleanup (can be called manually if needed)
export async function cleanupPrismaConnections() {
  try {
    if (global.__prisma) {
      safeConsoleError('Manually cleaning up Prisma connections...')
      await global.__prisma.$disconnect()
      safeConsoleError('Prisma connections cleaned up')
    }
  } catch (error) {
    safeConsoleError('Error during manual cleanup:', error)
  }
}

// Ensure we have a global client instance
if (!global.__prisma) {
  global.__prisma = getPrismaClient()
}
