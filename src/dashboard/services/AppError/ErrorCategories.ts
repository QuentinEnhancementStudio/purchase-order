/**
 * Error categories for exceptions only (not expected user flows)
 * These represent system failures and unexpected conditions
 */
export enum ErrorCategory {
  NETWORK = 'network',               // Network/connection failures
  AUTH = 'auth',                     // Authentication failures  
  AUTHORIZATION = 'authorization',   // Permission denied
  SERVER = 'server',                 // Backend/database errors
  CLIENT = 'client',                 // Frontend runtime errors
  INPUT = 'input',                   // Invalid input/validation errors
  RATE_LIMIT = 'rate_limit',        // API rate limiting
  TIMEOUT = 'timeout',              // Request timeouts
  CONFIGURATION = 'configuration',   // Missing/invalid config
  SYSTEM = 'system',                // System-level failures
  WIXPLATFORM = 'wix_platform',     // Wix platform API errors
  WIXDATA = 'wix_data',             // Wix Data API errors
  UNKNOWN = 'unknown'               // Unclassified exceptions
}

/**
 * Error severity levels to indicate impact and urgency
 */
export enum ErrorSeverity {
  LOW = 'low',       // Minor issues, recoverable, minimal user impact
  MEDIUM = 'medium', // Significant issues, user action needed, moderate impact
  HIGH = 'high',     // Critical issues, system impact, major functionality affected
  FATAL = 'fatal'    // System-breaking errors, complete failure
}

/**
 * Type guard to check if a string is a valid ErrorSeverity
 */
export const isErrorSeverity = (value: string): value is ErrorSeverity => {
  return Object.values(ErrorSeverity).includes(value as ErrorSeverity);
};

/**
 * Get human-readable category name
 */
export const getCategoryDisplayName = (category: ErrorCategory): string => {
  const displayNames: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: 'Network Error',
    [ErrorCategory.AUTH]: 'Authentication Error',
    [ErrorCategory.AUTHORIZATION]: 'Authorization Error',
    [ErrorCategory.SERVER]: 'Server Error',
    [ErrorCategory.CLIENT]: 'Client Error',
    [ErrorCategory.INPUT]: 'Input Validation Error',
    [ErrorCategory.RATE_LIMIT]: 'Rate Limit Error',
    [ErrorCategory.TIMEOUT]: 'Timeout Error',
    [ErrorCategory.CONFIGURATION]: 'Configuration Error',
    [ErrorCategory.SYSTEM]: 'System Error',
    [ErrorCategory.WIXPLATFORM]: 'Wix Platform Error',
    [ErrorCategory.WIXDATA]: 'Wix Data Error',
    [ErrorCategory.UNKNOWN]: 'Unknown Error'
  };
  
  return displayNames[category] || 'Unknown Error';
};

/**
 * Get human-readable severity name
 */
export const getSeverityDisplayName = (severity: ErrorSeverity): string => {
  const displayNames: Record<ErrorSeverity, string> = {
    [ErrorSeverity.LOW]: 'Low Priority',
    [ErrorSeverity.MEDIUM]: 'Medium Priority',
    [ErrorSeverity.HIGH]: 'High Priority',
    [ErrorSeverity.FATAL]: 'Critical'
  };
  
  return displayNames[severity] || 'Unknown Priority';
};