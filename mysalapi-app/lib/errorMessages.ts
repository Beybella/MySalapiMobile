/**
 * User-friendly error message translations
 * Converts technical errors into helpful messages
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Cannot connect to server. Check your internet connection.',
  'Network request failed': 'Network error. Please try again.',
  'timeout': 'Request timed out. Please try again.',
  'ETIMEDOUT': 'Connection timeout. Check your internet connection.',
  
  // Supabase/Database errors
  'duplicate key value': 'This record already exists.',
  'foreign key constraint': 'Cannot delete. This item is being used elsewhere.',
  'invalid input syntax': 'Please check your input and try again.',
  'violates check constraint': 'Invalid value provided. Please check your input.',
  'null value in column': 'Required field is missing.',
  
  // Validation errors
  'No MySalapi user found': 'This email is not registered. They must sign up first.',
  'Amount exceeds remaining balance': 'Payment is more than what\'s owed.',
  'must be a MySalapi user': 'This email is not registered. They must sign up first.',
  
  // Auth errors
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please verify your email first.',
  'User already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Invalid email': 'Please enter a valid email address.',
  
  // API errors
  'Brevo API error': 'Email service unavailable. Try again later.',
  'Laravel backend': 'Backend server is not responding.',
  '500': 'Server error. Please try again later.',
  '404': 'Resource not found.',
  '403': 'Access denied.',
  '401': 'Authentication failed. Please log in again.',
  
  // Business logic errors
  'insufficient funds': 'You don\'t have enough budget for this expense.',
  'already paid': 'This loan has already been marked as paid.',
  'invalid date': 'Please enter a valid date.',
  'due date must be after loan date': 'Due date must be after the loan date.',
};

/**
 * Convert technical error to user-friendly message
 */
export function getFriendlyError(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';
  
  const errorMsg = typeof error === 'string' ? error : error?.message || String(error);
  
  // Check for known patterns
  for (const [pattern, friendly] of Object.entries(ERROR_MESSAGES)) {
    if (errorMsg.toLowerCase().includes(pattern.toLowerCase())) {
      return friendly;
    }
  }
  
  // Check for specific status codes
  if (error?.status || error?.statusCode) {
    const status = String(error.status || error.statusCode);
    if (ERROR_MESSAGES[status]) {
      return ERROR_MESSAGES[status];
    }
  }
  
  // Return original if it's already user-friendly (not too technical)
  if (errorMsg.length < 100 && !errorMsg.includes('Error:') && !errorMsg.includes('Exception')) {
    return errorMsg;
  }
  
  // Fallback for unknown errors
  return 'Something went wrong. Please try again.';
}

/**
 * Format error for logging (keep technical details)
 */
export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    context,
    message: error?.message,
    stack: error?.stack,
    raw: error,
  };
  
  console.error('[MySalapi Error]', errorDetails);
  
  // In production, you could send this to an error tracking service
  // e.g., Sentry, Bugsnag, etc.
}
