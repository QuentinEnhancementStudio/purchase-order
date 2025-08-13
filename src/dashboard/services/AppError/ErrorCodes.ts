/**
 * Hierarchical error codes for precise error identification
 * Format: DOMAIN.OPERATION.SPECIFIC_ISSUE
 */

// ========== PARTNER MANAGEMENT DOMAIN ==========

/**
 * Partner creation errors
 */
export type PartnerCreateErrorCode = 
  | 'PARTNER.CREATE.DUPLICATE_EMAIL'    // Email already exists in system
  | 'PARTNER.CREATE.INVALID_DATA'       // Required fields missing or invalid
  | 'PARTNER.CREATE.QUOTA_EXCEEDED'     // Maximum partner limit reached
  | 'PARTNER.CREATE.PERMISSION_DENIED'; // User not allowed to create partners

/**
 * Partner update errors
 */
export type PartnerUpdateErrorCode = 
  | 'PARTNER.UPDATE.NOT_FOUND'          // Partner ID doesn't exist
  | 'PARTNER.UPDATE.CONCURRENT_EDIT'    // Another user modified partner simultaneously
  | 'PARTNER.UPDATE.INVALID_DATA'       // Update data validation failed
  | 'PARTNER.UPDATE.PERMISSION_DENIED'; // User not allowed to edit this partner

/**
 * Partner deletion errors
 */
export type PartnerDeleteErrorCode = 
  | 'PARTNER.DELETE.NOT_FOUND'          // Partner ID doesn't exist
  | 'PARTNER.DELETE.HAS_ORDERS'         // Cannot delete partner with active orders
  | 'PARTNER.DELETE.PERMISSION_DENIED'; // User not allowed to delete this partner

/**
 * Partner loading errors
 */
export type PartnerLoadErrorCode = 
  | 'PARTNER.LOAD.NOT_FOUND'            // Partner ID doesn't exist
  | 'PARTNER.LOAD.PERMISSION_DENIED'    // User not allowed to view this partner
  | 'PARTNER.LOAD.DATA_CORRUPTED';      // Partner data is corrupted or incomplete

/**
 * All partner management error codes
 */
export type PartnerErrorCode = 
  | PartnerCreateErrorCode 
  | PartnerUpdateErrorCode 
  | PartnerDeleteErrorCode 
  | PartnerLoadErrorCode;

// ========== VALIDATION DOMAIN ==========

/**
 * Field validation errors
 */
export type ValidationFieldErrorCode = 
  | 'VALIDATION.FIELD.REQUIRED'         // Required field is missing
  | 'VALIDATION.FIELD.INVALID_FORMAT'   // Field format doesn't match pattern
  | 'VALIDATION.FIELD.TOO_SHORT'        // Field value below minimum length
  | 'VALIDATION.FIELD.TOO_LONG'         // Field value exceeds maximum length
  | 'VALIDATION.FIELD.INVALID_TYPE';    // Field type doesn't match expected type

/**
 * Business rule validation errors
 */
export type ValidationBusinessErrorCode = 
  | 'VALIDATION.BUSINESS_RULE.VIOLATED' // Business logic constraint failed
  | 'VALIDATION.BUSINESS_RULE.CONFLICT' // Data conflicts with existing records
  | 'VALIDATION.BUSINESS_RULE.DEPENDENCY'; // Missing required dependencies

/**
 * Data integrity validation errors
 */
export type ValidationIntegrityErrorCode = 
  | 'VALIDATION.INTEGRITY.CHECKSUM_FAILED'   // Data checksum validation failed
  | 'VALIDATION.INTEGRITY.FOREIGN_KEY'       // Foreign key constraint violation
  | 'VALIDATION.INTEGRITY.UNIQUE_CONSTRAINT'; // Unique constraint violation

/**
 * All validation related error codes
 */
export type ValidationErrorCode = 
  | ValidationFieldErrorCode 
  | ValidationBusinessErrorCode 
  | ValidationIntegrityErrorCode;
// ========== MASTER ERROR CODE TYPE ==========

/**
 * Union of all error codes across all domains
 * This is the main type used throughout the application
 */
export type ErrorCode = 
  | PartnerErrorCode 
  | ValidationErrorCode 

// ========== ERROR CODE UTILITIES ==========

/**
 * Check if a string is a valid error code
 */
export const isValidErrorCode = (code: string): code is ErrorCode => {
  const allCodes: ErrorCode[] = [    
    // Partner codes
    'PARTNER.CREATE.DUPLICATE_EMAIL', 'PARTNER.CREATE.INVALID_DATA', 'PARTNER.CREATE.QUOTA_EXCEEDED', 'PARTNER.CREATE.PERMISSION_DENIED',
    'PARTNER.UPDATE.NOT_FOUND', 'PARTNER.UPDATE.CONCURRENT_EDIT', 'PARTNER.UPDATE.INVALID_DATA', 'PARTNER.UPDATE.PERMISSION_DENIED',
    'PARTNER.DELETE.NOT_FOUND', 'PARTNER.DELETE.HAS_ORDERS', 'PARTNER.DELETE.PERMISSION_DENIED',
    'PARTNER.LOAD.NOT_FOUND', 'PARTNER.LOAD.PERMISSION_DENIED', 'PARTNER.LOAD.DATA_CORRUPTED',

    // Validation codes
    'VALIDATION.FIELD.REQUIRED', 'VALIDATION.FIELD.INVALID_FORMAT', 'VALIDATION.FIELD.TOO_SHORT', 'VALIDATION.FIELD.TOO_LONG', 'VALIDATION.FIELD.INVALID_TYPE',
    'VALIDATION.BUSINESS_RULE.VIOLATED', 'VALIDATION.BUSINESS_RULE.CONFLICT', 'VALIDATION.BUSINESS_RULE.DEPENDENCY',
    'VALIDATION.INTEGRITY.CHECKSUM_FAILED', 'VALIDATION.INTEGRITY.FOREIGN_KEY', 'VALIDATION.INTEGRITY.UNIQUE_CONSTRAINT',
  ];
  
  return allCodes.includes(code as ErrorCode);
};

/**
 * Extract domain from error code
 */
export const getErrorCodeDomain = (code: ErrorCode): string => {
  return code.split('.')[0];
};

/**
 * Extract operation from error code
 */
export const getErrorCodeOperation = (code: ErrorCode): string => {
  const parts = code.split('.');
  return parts.length > 1 ? parts[1] : '';
};

/**
 * Extract specific issue from error code
 */
export const getErrorCodeIssue = (code: ErrorCode): string => {
  const parts = code.split('.');
  return parts.length > 2 ? parts[2] : '';
};