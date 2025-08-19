/**
 * Utility functions for error handling and sanitization
 */

/**
 * Sanitizes error objects to remove sensitive information like DATABASE_URLs
 * from error messages and stack traces before logging
 */
export function sanitizeError(error: any): any {
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
    
    // Handle error details that might contain sensitive info
    if (sanitized.meta && typeof sanitized.meta === 'object') {
      sanitized.meta = sanitizeError(sanitized.meta);
    }
    
    return sanitized;
  }
  
  return error;
}

/**
 * Safe console.error that automatically sanitizes error objects
 */
export function safeConsoleError(message: string, error?: any): void {
  if (error) {
    console.error(message, sanitizeError(error));
  } else {
    console.error(message);
  }
}

/**
 * Safe console.log that automatically sanitizes any objects that might contain sensitive data
 */
export function safeConsoleLog(message: string, data?: any): void {
  if (data) {
    console.log(message, sanitizeError(data));
  } else {
    console.log(message);
  }
}
