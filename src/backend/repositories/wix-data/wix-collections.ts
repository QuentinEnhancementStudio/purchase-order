import { items as dataItems } from '@wix/data';
import { auth } from '@wix/essentials';
import { WixEntity, DataOperationOptions, WixDataError } from '../../types/base-entity';

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
      throw this.handleWixError(error, 'create');
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
      throw this.handleWixError(error, 'findById', id);
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
      throw this.handleWixError(error, 'findAll');
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
      throw this.handleWixError(error, 'update', item._id);
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
      throw this.handleWixError(error, 'remove', id);
    }
  }


  public query() {
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
      throw this.handleWixError(error, 'findByField');
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
      throw this.handleWixError(error, 'findOneByField');
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
      throw this.handleWixError(error, 'count');
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
      throw this.handleWixError(error, 'countByField');
    }
  }

  /**
   * Handle Wix Data errors with context-based error handling
   */
  public handleWixError(
    error: any, 
    operation?: string, 
    itemId?: string
  ): WixDataError {
    // Auto-detect calling method from stack trace
    const stack = new Error().stack;
    const callerMatch = stack?.split('\n')[3]?.match(/at \w+\.(\w+)/);
    const method = callerMatch?.[1] || 'unknown';
    
    // Build context for better debugging
    const context = {
      operation: operation || 'unknown',
      collection: this.collectionName,
      itemId,
      method
    };
    
    // Create enhanced error message with location context
    const location = `${context.collection}.${context.method}(${context.operation}${context.itemId ? `, id: ${context.itemId}` : ''})`;
    const enhancedMessage = `${location}: ${error.message || 'Database operation failed'}`;
    
    console.error('Wix Data error:', {
      location,
      context,
      error
    });
    
    const wixError: WixDataError = {
      name: 'WixDataError',
      message: enhancedMessage,
      code: error.code || 'UNKNOWN_ERROR',
      description: error.description,
      data: {
        ...error.data,
        context
      }
    };
    
    return wixError;
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