/**
 * Base interfaces for entities in the Wix data collections
 */

/**
 * Standard Wix entity with system-generated fields
 * All Wix Data collections use this structure
 */
export interface WixEntity {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  _owner?: string;
}

/**
 * Options for data operations
 */
export interface DataOperationOptions {
  consistentRead?: boolean;
  suppressHooks?: boolean;
  showDrafts?: boolean;
  language?: string;
  returnTotalCount?: boolean;
}


/**
 * Error types for Wix Data operations
 */
export interface WixDataError extends Error {
  code: string;
  description?: string;
  data?: Record<string, any>;
}