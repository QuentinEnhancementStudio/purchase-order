import { PurchaseOrder, PurchaseOrderStatus } from '../../types/entities/purchase-order';
import { WixCollectionsRepository } from '../wix-data/wix-collections';
import { DataOperationOptions } from '../../types/base-entity';

export class PurchaseOrdersRepository extends WixCollectionsRepository<PurchaseOrder> {
  protected readonly collectionName = 'PurchaseOrders';

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(orderData: Omit<PurchaseOrder, '_id' | '_createdDate' | '_updatedDate'>): Promise<PurchaseOrder> {
    // Validate required fields
    this.validateRequiredFields(orderData, ['identifier', 'status', 'memberId', 'version']);
    
    // For Wix entities, the system will automatically add _id, _createdDate, _updatedDate
    return await this.create(orderData);
  }

  /**
   * Get all purchase orders
   */
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await this.findAll();
  }

  /**
   * Find purchase order by ID
   */
  async getPurchaseOrderById(orderId: string): Promise<PurchaseOrder | null> {
    return await this.findById(orderId);
  }

  /**
   * Find purchase orders by member ID
   */
  async getPurchaseOrdersByMemberId(memberId: string): Promise<PurchaseOrder[]> {
    return await this.findByField('memberId', memberId);
  }

  /**
   * Find purchase orders by status
   */
  async getPurchaseOrdersByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return await this.findByField('status', status);
  }

  /**
   * Find purchase order by identifier
   */
  async getPurchaseOrderByIdentifier(identifier: string): Promise<PurchaseOrder | null> {
    return await this.findOneByField('identifier', identifier);
  }

  /**
   * Find purchase orders by order ID (if converted to order)
   */
  async getPurchaseOrdersByOrderId(orderId: string): Promise<PurchaseOrder[]> {
    return await this.findByField('orderId', orderId);
  }

  /**
   * Find purchase orders by draft order ID
   */
  async getPurchaseOrdersByDraftOrderId(draftOrderId: string): Promise<PurchaseOrder[]> {
    return await this.findByField('draftOrderId', draftOrderId);
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(updates: Partial<PurchaseOrder> & { _id: string }): Promise<PurchaseOrder> {
    return await this.update(updates);
  }

  /**
   * Update purchase order status with optional comments
   */
  async updatePurchaseOrderStatus(orderId: string, status: PurchaseOrderStatus, comments?: string): Promise<PurchaseOrder> {
    const updates: Partial<PurchaseOrder> & { _id: string } = { _id: orderId, status };
    
    if (comments) {
      updates.adminComments = comments;
    }
    
    return this.updatePurchaseOrder(updates);
  }

  /**
   * Update purchase order version (for optimistic locking)
   */
  async updatePurchaseOrderVersion(orderId: string, version: number): Promise<PurchaseOrder> {
    return this.updatePurchaseOrder({ _id: orderId, version });
  }

  /**
   * Add or update draft order information
   */
  async updateDraftOrder(orderId: string, draftOrderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return this.updatePurchaseOrder({ _id: orderId, ...draftOrderData });
  }

  /**
   * Get purchase orders with pagination
   */
  async getPurchaseOrdersWithPagination(options: {
    limit?: number;
    skip?: number;
    status?: PurchaseOrderStatus;
    memberId?: string;
    sortBy?: 'createdDate' | 'updatedDate' | 'identifier';
    sortOrder?: 'asc' | 'desc';
  }, dataOptions?: DataOperationOptions): Promise<PurchaseOrder[]> {
    try {
      let query = this.query();

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.memberId) {
        query = query.eq('memberId', options.memberId);
      }

      // Apply sorting
      const sortField = options.sortBy ? `_${options.sortBy}` : '_createdDate'; // Map to Wix field names
      if (options.sortOrder === 'asc') {
        query = query.ascending([sortField]);
      } else {
        query = query.descending([sortField]);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }

      const result = await query.find(dataOptions);
      return result.items as PurchaseOrder[];
    } catch (error) {
      throw this.handleWixError(error);
    }
  }

  /**
   * Count purchase orders by status
   */
  async countPurchaseOrdersByStatus(status: PurchaseOrderStatus): Promise<number> {
    return await this.countByField('status', status);
  }

  /**
   * Count purchase orders by member
   */
  async countPurchaseOrdersByMemberId(memberId: string): Promise<number> {
    return await this.countByField('memberId', memberId);
  }

  /**
   * Get total number of purchase orders
   */
  async getTotalPurchaseOrdersCount(): Promise<number> {
    return await this.count();
  }

  /**
   * Delete purchase order
   */
  async removePurchaseOrder(orderId: string): Promise<PurchaseOrder> {
    return await this.remove(orderId);
  }

  /**
   * Search purchase orders with advanced filters
   */
  async searchPurchaseOrders(filters: {
    status?: PurchaseOrderStatus;
    memberId?: string;
    identifier?: string;
    orderId?: string;
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    limit?: number;
    skip?: number;
  }, options?: DataOperationOptions): Promise<PurchaseOrder[]> {
    try {
      let query = this.query();

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.memberId) {
        query = query.eq('memberId', filters.memberId);
      }
      
      if (filters.identifier) {
        query = query.contains('identifier', filters.identifier);
      }
      
      if (filters.orderId) {
        query = query.eq('orderId', filters.orderId);
      }

      // Date range filtering
      if (filters.dateRange) {
        if (filters.dateRange.from && filters.dateRange.to) {
          query = query.between('_createdDate', filters.dateRange.from, filters.dateRange.to);
        } else if (filters.dateRange.from) {
          query = query.ge('_createdDate', filters.dateRange.from);
        } else if (filters.dateRange.to) {
          query = query.le('_createdDate', filters.dateRange.to);
        }
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.skip) {
        query = query.skip(filters.skip);
      }

      const result = await query.find(options);
      return result.items as PurchaseOrder[];
    } catch (error) {
      throw this.handleWixError(error);
    }
  }

  /**
   * Get recent purchase orders (last 30 days)
   */
  async getRecentPurchaseOrders(limit: number = 50): Promise<PurchaseOrder[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.searchPurchaseOrders({
      dateRange: { from: thirtyDaysAgo },
      limit
    });
  }

  /**
   * Get pending purchase orders for a member
   */
  async getPendingOrdersForMember(memberId: string): Promise<PurchaseOrder[]> {
    return this.searchPurchaseOrders({
      memberId,
      status: 'pending' as PurchaseOrderStatus
    });
  }

  /**
   * Get purchase orders by status with detailed filtering
   */
  async getOrdersByStatusDetailed(
    status: PurchaseOrderStatus, 
    options: {
      includeConverted?: boolean;
      dateRange?: { from?: Date; to?: Date };
      limit?: number;
    } = {}
  ): Promise<PurchaseOrder[]> {
    try {
      let query = this.query().eq('status', status);

      // Optional: include approved orders (converted orders use APPROVED status)
      if (options.includeConverted && status !== PurchaseOrderStatus.APPROVED) {
        const approvedQuery = this.query().eq('status', PurchaseOrderStatus.APPROVED);
        query = query.or(approvedQuery);
      }

      // Date range filtering
      if (options.dateRange) {
        if (options.dateRange.from && options.dateRange.to) {
          query = query.between('_createdDate', options.dateRange.from, options.dateRange.to);
        } else if (options.dateRange.from) {
          query = query.ge('_createdDate', options.dateRange.from);
        } else if (options.dateRange.to) {
          query = query.le('_createdDate', options.dateRange.to);
        }
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Sort by most recent first
      query = query.descending(['_createdDate']);

      const result = await query.find();
      return result.items as PurchaseOrder[];
    } catch (error) {
      throw this.handleWixError(error);
    }
  }
}