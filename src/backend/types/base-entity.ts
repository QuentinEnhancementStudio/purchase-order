/**
 * Base types for Wix Data entities and operations
 */

/**
 * Base Wix entity with system fields
 */
export interface WixEntity {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  _owner?: string;
}

/**
 * Data operation options for Wix Data API calls
 */
export interface DataOperationOptions {
  suppressAuth?: boolean;
  suppressHooks?: boolean;
}