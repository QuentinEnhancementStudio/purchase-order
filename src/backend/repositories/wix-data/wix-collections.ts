import { items as dataItems } from '@wix/data';
import { auth } from '@wix/essentials';
import { WixEntity, DataOperationOptions } from '../../types/base-entity';
import { AppError } from '../../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../../dashboard/services/AppError/ErrorCategories';
import { WixDataErrorCode } from '../../../dashboard/services/AppError/ErrorCodes';

/**
 * Generic CRUD repository for Wix Data collections
 * **Security Note**: This repository uses auth.elevate() to bypass permission restrictions.
 * Elevation should only be used in secure backend contexts where proper authorization
 * checks are in place. Do not expose elevated operations directly to frontend without
 * proper validation and security measures.
 */
export abstract class WixCollectionsRepository<T extends WixEntity> {
  /**
   * The name of the collection this repository manages
   */
  protected abstract readonly collectionName: string;

  /**
   * Debug mode flag - set to true to enable operation logging
   */
  protected abstract readonly debugEnabled: boolean;

  /**
   * Elevated data operations with proper permissions
   * These work regardless of the calling context (frontend, backend, dashboard)
   */
  private readonly elevatedInsert = auth.elevate(dataItems.insert);
  private readonly elevatedGet = auth.elevate(dataItems.get);
  private readonly elevatedUpdate = auth.elevate(dataItems.update);
  private readonly elevatedRemove = auth.elevate(dataItems.remove);
  private readonly elevatedQuery = auth.elevate(dataItems.query);

	/**
   * @Claude Change the return type of findAll, query to Wix Query Result (see MCP) of type T instead of T. Then update partners repository and purchase-orders repository to use the new type.
   * Finally update the rest of the application to use the new type.
   */


  /**
   * Debug logging helper
   */
  private debug(operation: string, params?: any): void {
    if (!this.debugEnabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔍 [${timestamp}] ${this.collectionName}.${operation}`, params || '');
  }

  /**
   * Create a new item in the collection
   * Wix automatically adds _id, _createdDate, and _updatedDate
   */
  public async create(item: Omit<T, '_id' | '_createdDate' | '_updatedDate' | '_owner'>, options?: DataOperationOptions): Promise<T> {
    this.debug('create', { fields: Object.keys(item) });
    
    try {
      // Wix Data will automatically add _id, _createdDate, and _updatedDate
      const result = await this.elevatedInsert(this.collectionName, item as any, options);
      return result as unknown as T;
    } catch (error) {
      throw this.createWixDataError(error, 'create');
    }
  }

  /**
   * Get an item by ID
   */
  public async findById(id: string, options?: DataOperationOptions): Promise<T | null> {
    this.debug('findById', { id });
    
    try {
      const result = await this.elevatedGet(this.collectionName, id, options);
      return result as unknown as T;
    } catch (error: any) {
      if (error.code === 'WDE0002' || error.code === 'WDE0011') {
        return null; // Item not found
      }
      throw this.createWixDataError(error, 'findById', id);
    }
  }

  /**
   * Get all items in the collection
   */
  public async findAll(options?: DataOperationOptions): Promise<T[]> {
    this.debug('findAll');
    
    try {
      const result = await this.elevatedQuery(this.collectionName)
        .find(options);
      return result.items as unknown as T[];
    } catch (error) {
      throw this.createWixDataError(error, 'findAll');
    }
  }

  /**
   * Update an item
   * Wix automatically updates _updatedDate
   * The item object must include _id
   */
  public async update(item: Partial<T> & { _id: string }, options?: DataOperationOptions): Promise<T> {
    this.debug('update', { id: item._id, fields: Object.keys(item) });
    
    try {
      // Wix Data will automatically update _updatedDate
      const result = await this.elevatedUpdate(this.collectionName, item as any, options);
      return result as unknown as T;
    } catch (error) {
      throw this.createWixDataError(error, 'update', item._id);
    }
  }

  /**
   * Remove an item
   */
  public async remove(id: string, options?: DataOperationOptions): Promise<T> {
    this.debug('remove', { id });
    
    try {
      const result = await this.elevatedRemove(this.collectionName, id, options);
      return result as unknown as T;
    } catch (error) {
      throw this.createWixDataError(error, 'remove', id);
    }
  }


  protected query() {
    this.debug('query');
    return this.elevatedQuery(this.collectionName);
  }

  /**
   * Find items by a specific field value
   * Convenience method that wraps query().eq(field, value).find()
   */
  public async findByField(field: string, value: any, options?: DataOperationOptions): Promise<T[]> {
    this.debug('findByField', { field, value });
    
    try {
      const result = await this.query()
        .eq(field, value)
        .find(options);
      return result.items as unknown as T[];
    } catch (error) {
      throw this.createWixDataError(error, 'findByField');
    }
  }

  /**
   * Find first item by a specific field value
   */
  public async findOneByField(field: string, value: any, options?: DataOperationOptions): Promise<T | null> {
    this.debug('findOneByField', { field, value });
    
    try {
      const result = await this.query()
        .eq(field, value)
        .limit(1)
        .find(options);
      return result.items[0] as unknown as T || null;
    } catch (error) {
      throw this.createWixDataError(error, 'findOneByField');
    }
  }

  /**
   * Count items that match a query
   */
  public async count(options?: DataOperationOptions): Promise<number> {
    this.debug('count');
    
    try {
      return await this.query().count(options);
    } catch (error) {
      throw this.createWixDataError(error, 'count');
    }
  }

  /**
   * Count items by a specific field value
   */
  public async countByField(field: string, value: any, options?: DataOperationOptions): Promise<number> {
    this.debug('countByField', { field, value });
    
    try {
      return await this.query()
        .eq(field, value)
        .count(options);
    } catch (error) {
      throw this.createWixDataError(error, 'countByField');
    }
  }

  /**
   * Map Wix error codes to AppError codes
   */
  private mapWixErrorCode(wixCode: string): WixDataErrorCode | undefined {
    const mapping: Record<string, WixDataErrorCode> = {
      // Collection errors
      'WDE0001': 'WIXDATA.COLLECTION.INVALID_NAME',
      'WDE0025': 'WIXDATA.COLLECTION.NOT_FOUND',
      'WDE0026': 'WIXDATA.COLLECTION.REMOVED',
      'WDE0027': 'WIXDATA.COLLECTION.PERMISSION_DENIED',
      'WDE0052': 'WIXDATA.COLLECTION.TEMPLATE_MODE',
      'WDE0144': 'WIXDATA.COLLECTION.PERMISSION_DENIED',
      'WDE0171': 'WIXDATA.COLLECTION.NOT_INSTALLED',
      'WDE0177': 'WIXDATA.COLLECTION.PERMISSION_DENIED',

      // Item errors
      'WDE0002': 'WIXDATA.ITEM.NOT_FOUND',
      'WDE0004': 'WIXDATA.ITEM.INVALID_DATA',
      'WDE0005': 'WIXDATA.ITEM.INVALID_DATA',
      'WDE0007': 'WIXDATA.ITEM.INVALID_DATA',
      'WDE0009': 'WIXDATA.ITEM.TOO_LARGE',
      'WDE0068': 'WIXDATA.ITEM.INVALID_ID',
      'WDE0073': 'WIXDATA.ITEM.NOT_FOUND',
      'WDE0074': 'WIXDATA.ITEM.ALREADY_EXISTS',
      'WDE0079': 'WIXDATA.ITEM.INVALID_ID',
      'WDE0109': 'WIXDATA.ITEM.TOO_LARGE',
      'WDE0168': 'WIXDATA.ITEM.NESTING_TOO_DEEP',
      'WDE0178': 'WIXDATA.ITEM.INVALID_REVISION',
      'WDE0180': 'WIXDATA.ITEM.TOO_LARGE',

      // Query errors
      'WDE0008': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0011': 'WIXDATA.QUERY.INVALID_FILTER',
      'WDE0016': 'WIXDATA.QUERY.INVALID_FILTER',
      'WDE0028': 'WIXDATA.QUERY.TIMEOUT',
      'WDE0032': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0033': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0034': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0035': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0036': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0037': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0038': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0039': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0040': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0041': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0042': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0043': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0044': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0045': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0046': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0047': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0048': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0049': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0050': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0051': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0065': 'WIXDATA.QUERY.SORT_ERROR',
      'WDE0066': 'WIXDATA.QUERY.SORT_ERROR',
      'WDE0067': 'WIXDATA.QUERY.SORT_ERROR',
      'WDE0080': 'WIXDATA.QUERY.INVALID_PARAMETERS',
      'WDE0092': 'WIXDATA.QUERY.TOO_LARGE',
      'WDE0093': 'WIXDATA.QUERY.INVALID_FILTER',
      'WDE0121': 'WIXDATA.QUERY.SORT_ERROR',
      'WDE0151': 'WIXDATA.QUERY.PAGINATION_ERROR',
      'WDE0152': 'WIXDATA.QUERY.PAGINATION_ERROR',
      'WDE0159': 'WIXDATA.QUERY.PAGINATION_ERROR',
      'WDE0165': 'WIXDATA.QUERY.PAGINATION_ERROR',
      'WDE0169': 'WIXDATA.QUERY.FILTER_TOO_DEEP',
      'WDE0190': 'WIXDATA.QUERY.SEARCH_NOT_ENABLED',

      // System errors
      'WDE0014': 'WIXDATA.SYSTEM.QUOTA_EXCEEDED',
      'WDE0053': 'WIXDATA.SYSTEM.UNKNOWN_ERROR',
      'WDE0054': 'WIXDATA.SYSTEM.UNKNOWN_ERROR',
      'WDE0055': 'WIXDATA.SYSTEM.PARSE_ERROR',
      'WDE0078': 'WIXDATA.SYSTEM.HOOK_ERROR',
      'WDE0091': 'WIXDATA.SYSTEM.QUOTA_EXCEEDED',
      'WDE0111': 'WIXDATA.SYSTEM.CONFIGURATION_ERROR',
      'WDE0115': 'WIXDATA.SYSTEM.UNKNOWN_ERROR',
      'WDE0116': 'WIXDATA.EXTERNAL.RESPONSE_ERROR',
      'WDE0117': 'WIXDATA.SYSTEM.CONFIGURATION_ERROR',
      'WDE0118': 'WIXDATA.SYSTEM.CONFIGURATION_ERROR',
      'WDE0150': 'WIXDATA.SYSTEM.HOOK_ERROR',
      'WDE0172': 'WIXDATA.SYSTEM.HOOK_ERROR',
      'WDE0179': 'WIXDATA.SYSTEM.SANDBOX_DISABLED',

      // Validation errors
      'WDE0024': 'WIXDATA.VALIDATION.FIELD_DELETED',
      'WDE0056': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0057': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0058': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0059': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0060': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0061': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0062': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0063': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0064': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0076': 'WIXDATA.VALIDATION.APP_VALIDATION',
      'WDE0094': 'WIXDATA.VALIDATION.FIELD_ERROR',
      'WDE0123': 'WIXDATA.VALIDATION.UNIQUE_CONSTRAINT',
      'WDE0133': 'WIXDATA.VALIDATION.INDEX_ERROR',
      'WDE0134': 'WIXDATA.VALIDATION.FIELD_NAME_INVALID',
      'WDE0160': 'WIXDATA.VALIDATION.INDEX_ERROR',
      'WDE0164': 'WIXDATA.VALIDATION.INDEX_ERROR',
      'WDE0176': 'WIXDATA.VALIDATION.INDEX_ERROR',

      // Reference errors
      'WDE0019': 'WIXDATA.REFERENCE.INVALID',
      'WDE0020': 'WIXDATA.REFERENCE.INVALID',
      'WDE0021': 'WIXDATA.REFERENCE.INVALID',
      'WDE0029': 'WIXDATA.REFERENCE.ALREADY_EXISTS',
      'WDE0153': 'WIXDATA.REFERENCE.NOT_EXISTS',

      // External database errors
      'WDE0120': 'WIXDATA.EXTERNAL.NOT_SUPPORTED',
      'WDE0128': 'WIXDATA.EXTERNAL.NO_ID',
      'WDE0131': 'WIXDATA.EXTERNAL.CONNECTION_ERROR',
      'WDE0170': 'WIXDATA.EXTERNAL.NOT_SUPPORTED',

      // Multilingual errors
      'WDE0157': 'WIXDATA.MULTILINGUAL.FIELD_ERROR',
      'WDE0158': 'WIXDATA.MULTILINGUAL.FIELD_ERROR',
      'WDE0161': 'WIXDATA.MULTILINGUAL.NOT_ENABLED',
      'WDE0162': 'WIXDATA.MULTILINGUAL.LANGUAGE_ERROR',
      'WDE0174': 'WIXDATA.MULTILINGUAL.NOT_SUPPORTED',
      'WDE0175': 'WIXDATA.MULTILINGUAL.UPDATE_RESTRICTED',
    };
    
    return mapping[wixCode];
  }

  /**
   * Get severity for Wix error code
   */
  private getSeverityForWixError(wixCode: string): ErrorSeverity {
    switch (wixCode) {
      // Not found errors - Low severity
      case 'WDE0002':
      case 'WDE0073':
        return ErrorSeverity.LOW;
      
      // Permission and validation errors - Medium severity
      case 'WDE0027':
      case 'WDE0144':
      case 'WDE0177':
      case 'WDE0123':
      case 'WDE0076':
        return ErrorSeverity.MEDIUM;
      
      // System limits and timeouts - High severity
      case 'WDE0014':
      case 'WDE0028':
      case 'WDE0091':
      case 'WDE0092':
      case 'WDE0172':
        return ErrorSeverity.HIGH;
      
      // Unknown system errors - Fatal severity
      case 'WDE0053':
      case 'WDE0054':
      case 'WDE0115':
      case 'WDE0116':
        return ErrorSeverity.FATAL;
      
      // Default to Medium for other errors
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Create AppError from Wix Data errors with comprehensive mapping
   */
  protected createWixDataError(
    error: any,
    operation: string,
    itemId?: string
  ): AppError {
    const context = {
      operation,
      collection: this.collectionName,
      itemId,
      wixErrorCode: error.code,
      originalMessage: error.message,
      wixErrorDescription: error.description,
      wixErrorData: error.data
    };

    // Map Wix error codes to AppError codes
    const errorCode = this.mapWixErrorCode(error.code);
    
    return new AppError({
      category: ErrorCategory.WIXDATA,
      code: errorCode,
      technicalMessage: error.message || 'Wix Data operation failed',
      source: `${this.collectionName}.${operation}`,
      context,
      severity: this.getSeverityForWixError(error.code),
      layer: 'Repository'
    });
  }

  /**
   * Utility method to validate required fields
   */
  public validateRequiredFields(item: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !(field in item) || item[field] === undefined || item[field] === null);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
}