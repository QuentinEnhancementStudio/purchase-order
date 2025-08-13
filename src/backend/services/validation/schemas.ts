// Validation Utilities
import { z } from 'zod';

// Common Wix entity metadata schema
export const WixEntityMetadataSchema = z.object({
  _id: z.string().min(1, 'ID is required'),
  _createdDate: z.date(),
  _updatedDate: z.date(),
  _owner: z.string().optional()
});

// Harmonized pagination schema for consistent pagination across web methods
export const PaginationSchema = z.object({
  number: z.number().int().min(1).default(1),
  size: z.number().int().min(1).max(1000).default(25)
});

// Harmonized sorting schema for consistent sorting across web methods
export const SortingSchema = z.object({
  field: z.string().default('_createdDate'),
  direction: z.enum(['asc', 'desc']).default('asc')
});

/**
 * @Claude this is a schema for validating partner entities. it should in the partner web method file
 */
// Partner-specific sorting schema with allowed fields
export const PartnerSortingSchema = z.object({
  field: z.enum(['companyName', 'email', 'status', 'globalDiscountPercentage', '_createdDate', '_updatedDate']).default('companyName'),
  direction: z.enum(['asc', 'desc']).default('asc')
});

/**
 * Utility function to validate data against a schema and return typed result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws ZodError
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Utility function to safely validate data against a schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns SafeParseResult with success flag and either data or error
 */
export function safeValidateSchema<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
) {
  return schema.safeParse(data);
}

/**
 * Utility function to get validation error messages as array of strings
 * @param error - ZodError instance
 * @returns Array of formatted error messages
 */
export function getValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((err: any) => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
}