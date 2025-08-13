// Business-agnostic validation service
export {
  ValidationService,
  ValidationError,
  type ValidationResult
} from './validation';

// Re-export all schemas and types
export * from './schemas';

// Convenience exports for commonly used validation functions
export {
  validateSchema,
  safeValidateSchema,
  getValidationErrors,
} from './schemas';