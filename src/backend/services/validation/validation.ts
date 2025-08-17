import { z } from 'zod';

/**
 * Validation result type for comprehensive validation feedback
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  fieldErrors?: Record<string, string>;
}

/**
 * Validation error class for structured error handling
 */
export class ValidationError extends Error {
  public readonly fieldErrors: Record<string, string>;
  public readonly allErrors: string[];

  constructor(errors: string[], fieldErrors: Record<string, string> = {}) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
    this.allErrors = errors;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Formats Zod errors into a ValidationError instance
 */
function formatZodErrors(error: z.ZodError): ValidationError {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    const message = issue.message;
    
    fieldErrors[path] = message;
    errors.push(path === 'root' ? message : `${path}: ${message}`);
  });

  return new ValidationError(errors, fieldErrors);
}

/**
 * Generic validation function that works with any Zod schema
 */
function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  entityName?: string
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const validationError = formatZodErrors(result.error);
      return {
        success: false,
        errors: validationError.allErrors,
        fieldErrors: validationError.fieldErrors
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    const message = entityName 
      ? `Failed to validate ${entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      : `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

    return {
      success: false,
      errors: [message],
      fieldErrors: {}
    };
  }
}

/**
 * Validation function that throws on error - useful for middleware
 */
function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  entityName?: string
): T {
  const result = validateWithSchema(schema, data, entityName);
  
  if (!result.success) {
    throw new ValidationError(result.errors || [], result.fieldErrors || {});
  }

  return result.data!;
}


/**
 * Main validation service - business agnostic validation utilities
 */
export const ValidationService = {
  // Core validation functions
  validate: validateWithSchema,
  validateOrThrow,

  // Error handling
  ValidationError,
  formatZodErrors,

  /**
   * Validates multiple entities with a single call
   */
  validateBatch: <T>(
    validations: Array<{ schema: z.ZodSchema<T>; data: unknown; name?: string }>
  ): ValidationResult<T[]> => {
    const results: T[] = [];
    const allErrors: string[] = [];
    const allFieldErrors: Record<string, string> = {};

    for (const { schema, data, name } of validations) {
      const result = validateWithSchema(schema, data, name);
      
      if (!result.success) {
        allErrors.push(...(result.errors || []));
        Object.assign(allFieldErrors, result.fieldErrors || {});
      } else if (result.data) {
        results.push(result.data);
      }
    }

    if (allErrors.length > 0) {
      return {
        success: false,
        errors: allErrors,
        fieldErrors: allFieldErrors
      };
    }

    return {
      success: true,
      data: results
    };
  }
} as const;