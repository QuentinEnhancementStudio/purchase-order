/**
 * AppError module - Comprehensive error handling system
 * 
 * This module provides a complete error handling solution with:
 * - Hierarchical error codes for precise identification
 * - Immutable error properties (ID, category, code)
 * - Error chaining and wrapping across application layers
 * - Rich context and metadata support
 * - Type-safe error categorization
 * - Enhanced logging and serialization
 */

// Core AppError class and interfaces
export { AppError } from './AppError';
export type { 
  AppErrorConfig, 
  WrapErrorConfig, 
  SerializedAppError 
} from './AppError';

// Error categories and severity levels
export { 
  ErrorCategory, 
  ErrorSeverity,
  getCategoryDisplayName,
  getSeverityDisplayName,
  isErrorSeverity
} from './ErrorCategories';

// Hierarchical error codes
export type { 
  ErrorCode,
  PartnerErrorCode,
  ValidationErrorCode,
} from './ErrorCodes';

export { 
  isValidErrorCode, 
  getErrorCodeDomain, 
  getErrorCodeOperation, 
  getErrorCodeIssue 
} from './ErrorCodes';

// Re-export all types for convenience
export type { } from './ErrorCategories';