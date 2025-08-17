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

// ========== WIX DATA DOMAIN ==========

/**
 * Wix Data collection errors
 */
export type WixDataCollectionErrorCode = 
  | 'WIXDATA.COLLECTION.NOT_FOUND'           // WDE0025, WDE0026
  | 'WIXDATA.COLLECTION.PERMISSION_DENIED'   // WDE0027, WDE0144, WDE0177
  | 'WIXDATA.COLLECTION.INVALID_NAME'        // WDE0001
  | 'WIXDATA.COLLECTION.TEMPLATE_MODE'       // WDE0052
  | 'WIXDATA.COLLECTION.REMOVED'             // WDE0026
  | 'WIXDATA.COLLECTION.NOT_INSTALLED';      // WDE0171

/**
 * Wix Data item errors
 */
export type WixDataItemErrorCode = 
  | 'WIXDATA.ITEM.NOT_FOUND'                 // WDE0002, WDE0073
  | 'WIXDATA.ITEM.ALREADY_EXISTS'            // WDE0074
  | 'WIXDATA.ITEM.INVALID_DATA'              // WDE0004, WDE0005, WDE0007
  | 'WIXDATA.ITEM.TOO_LARGE'                 // WDE0009, WDE0109, WDE0180
  | 'WIXDATA.ITEM.INVALID_ID'                // WDE0002, WDE0068, WDE0079
  | 'WIXDATA.ITEM.INVALID_REVISION'          // WDE0178
  | 'WIXDATA.ITEM.NESTING_TOO_DEEP';         // WDE0168

/**
 * Wix Data query errors
 */
export type WixDataQueryErrorCode = 
  | 'WIXDATA.QUERY.INVALID_FILTER'           // WDE0011, WDE0016, WDE0093
  | 'WIXDATA.QUERY.INVALID_PARAMETERS'       // WDE0008, WDE0032-WDE0051, WDE0080
  | 'WIXDATA.QUERY.TIMEOUT'                  // WDE0028
  | 'WIXDATA.QUERY.TOO_LARGE'                // WDE0092
  | 'WIXDATA.QUERY.PAGINATION_ERROR'         // WDE0151, WDE0152, WDE0159, WDE0165
  | 'WIXDATA.QUERY.SORT_ERROR'               // WDE0121, WDE0065-WDE0067
  | 'WIXDATA.QUERY.FILTER_TOO_DEEP'          // WDE0169
  | 'WIXDATA.QUERY.SEARCH_NOT_ENABLED';      // WDE0190

/**
 * Wix Data system errors
 */
export type WixDataSystemErrorCode = 
  | 'WIXDATA.SYSTEM.QUOTA_EXCEEDED'          // WDE0014, WDE0091
  | 'WIXDATA.SYSTEM.UNKNOWN_ERROR'           // WDE0053, WDE0054, WDE0055, WDE0115, WDE0116
  | 'WIXDATA.SYSTEM.HOOK_ERROR'              // WDE0078, WDE0150, WDE0172
  | 'WIXDATA.SYSTEM.CONFIGURATION_ERROR'     // WDE0111, WDE0117, WDE0118
  | 'WIXDATA.SYSTEM.PARSE_ERROR'             // WDE0055
  | 'WIXDATA.SYSTEM.SANDBOX_DISABLED';       // WDE0179

/**
 * Wix Data validation errors
 */
export type WixDataValidationErrorCode = 
  | 'WIXDATA.VALIDATION.FIELD_ERROR'         // WDE0056-WDE0067, WDE0094
  | 'WIXDATA.VALIDATION.UNIQUE_CONSTRAINT'   // WDE0123
  | 'WIXDATA.VALIDATION.INDEX_ERROR'         // WDE0133, WDE0160, WDE0164, WDE0176
  | 'WIXDATA.VALIDATION.FIELD_DELETED'       // WDE0024
  | 'WIXDATA.VALIDATION.FIELD_NAME_INVALID'  // WDE0134
  | 'WIXDATA.VALIDATION.APP_VALIDATION';     // WDE0076

/**
 * Wix Data reference errors
 */
export type WixDataReferenceErrorCode = 
  | 'WIXDATA.REFERENCE.INVALID'              // WDE0019, WDE0020, WDE0021
  | 'WIXDATA.REFERENCE.ALREADY_EXISTS'       // WDE0029
  | 'WIXDATA.REFERENCE.NOT_EXISTS';          // WDE0153

/**
 * Wix Data external database errors
 */
export type WixDataExternalErrorCode = 
  | 'WIXDATA.EXTERNAL.CONNECTION_ERROR'      // WDE0131
  | 'WIXDATA.EXTERNAL.NOT_SUPPORTED'         // WDE0120, WDE0170
  | 'WIXDATA.EXTERNAL.NO_ID'                 // WDE0128
  | 'WIXDATA.EXTERNAL.RESPONSE_ERROR';       // WDE0116

/**
 * Wix Data multilingual errors
 */
export type WixDataMultilingualErrorCode = 
  | 'WIXDATA.MULTILINGUAL.NOT_SUPPORTED'     // WDE0174
  | 'WIXDATA.MULTILINGUAL.NOT_ENABLED'       // WDE0161
  | 'WIXDATA.MULTILINGUAL.LANGUAGE_ERROR'    // WDE0162
  | 'WIXDATA.MULTILINGUAL.FIELD_ERROR'       // WDE0157, WDE0158
  | 'WIXDATA.MULTILINGUAL.UPDATE_RESTRICTED'; // WDE0175

/**
 * All Wix Data related error codes
 */
export type WixDataErrorCode = 
  | WixDataCollectionErrorCode 
  | WixDataItemErrorCode 
  | WixDataQueryErrorCode 
  | WixDataSystemErrorCode 
  | WixDataValidationErrorCode 
  | WixDataReferenceErrorCode 
  | WixDataExternalErrorCode 
  | WixDataMultilingualErrorCode;
// ========== MASTER ERROR CODE TYPE ==========

/**
 * Union of all error codes across all domains
 * This is the main type used throughout the application
 */
export type ErrorCode = 
  | PartnerErrorCode 
  | ValidationErrorCode 
  | WixDataErrorCode 

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

    // WixData Collection codes
    'WIXDATA.COLLECTION.NOT_FOUND', 'WIXDATA.COLLECTION.PERMISSION_DENIED', 'WIXDATA.COLLECTION.INVALID_NAME',
    'WIXDATA.COLLECTION.TEMPLATE_MODE', 'WIXDATA.COLLECTION.REMOVED', 'WIXDATA.COLLECTION.NOT_INSTALLED',

    // WixData Item codes
    'WIXDATA.ITEM.NOT_FOUND', 'WIXDATA.ITEM.ALREADY_EXISTS', 'WIXDATA.ITEM.INVALID_DATA',
    'WIXDATA.ITEM.TOO_LARGE', 'WIXDATA.ITEM.INVALID_ID', 'WIXDATA.ITEM.INVALID_REVISION', 'WIXDATA.ITEM.NESTING_TOO_DEEP',

    // WixData Query codes
    'WIXDATA.QUERY.INVALID_FILTER', 'WIXDATA.QUERY.INVALID_PARAMETERS', 'WIXDATA.QUERY.TIMEOUT',
    'WIXDATA.QUERY.TOO_LARGE', 'WIXDATA.QUERY.PAGINATION_ERROR', 'WIXDATA.QUERY.SORT_ERROR',
    'WIXDATA.QUERY.FILTER_TOO_DEEP', 'WIXDATA.QUERY.SEARCH_NOT_ENABLED',

    // WixData System codes
    'WIXDATA.SYSTEM.QUOTA_EXCEEDED', 'WIXDATA.SYSTEM.UNKNOWN_ERROR', 'WIXDATA.SYSTEM.HOOK_ERROR',
    'WIXDATA.SYSTEM.CONFIGURATION_ERROR', 'WIXDATA.SYSTEM.PARSE_ERROR', 'WIXDATA.SYSTEM.SANDBOX_DISABLED',

    // WixData Validation codes
    'WIXDATA.VALIDATION.FIELD_ERROR', 'WIXDATA.VALIDATION.UNIQUE_CONSTRAINT', 'WIXDATA.VALIDATION.INDEX_ERROR',
    'WIXDATA.VALIDATION.FIELD_DELETED', 'WIXDATA.VALIDATION.FIELD_NAME_INVALID', 'WIXDATA.VALIDATION.APP_VALIDATION',

    // WixData Reference codes
    'WIXDATA.REFERENCE.INVALID', 'WIXDATA.REFERENCE.ALREADY_EXISTS', 'WIXDATA.REFERENCE.NOT_EXISTS',

    // WixData External codes
    'WIXDATA.EXTERNAL.CONNECTION_ERROR', 'WIXDATA.EXTERNAL.NOT_SUPPORTED', 'WIXDATA.EXTERNAL.NO_ID', 'WIXDATA.EXTERNAL.RESPONSE_ERROR',

    // WixData Multilingual codes
    'WIXDATA.MULTILINGUAL.NOT_SUPPORTED', 'WIXDATA.MULTILINGUAL.NOT_ENABLED', 'WIXDATA.MULTILINGUAL.LANGUAGE_ERROR',
    'WIXDATA.MULTILINGUAL.FIELD_ERROR', 'WIXDATA.MULTILINGUAL.UPDATE_RESTRICTED',
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