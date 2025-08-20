import { PurchaseOrder, PurchaseOrderBase, PurchaseOrderBaseSchema, PurchaseOrderStatus } from '../entities/purchase-order/schemas';
import { WixCollectionsRepository } from './wix-data/wix-collections';
import { DataOperationOptions } from '../types/base-entity';

export class PurchaseOrdersRepository extends WixCollectionsRepository<PurchaseOrder> {
	protected readonly collectionName = '@code-enhancement-studio/purchase-order/PurchaseOrders';
	protected readonly debugEnabled = false;

	/**
	 * Create a new purchase order
	 */
	async createPurchaseOrder(order: PurchaseOrderBase): Promise<PurchaseOrder> {
		// Validate using PurchaseOrderBaseSchema
		const validatedData = PurchaseOrderBaseSchema.parse(order);

		return await this.create(validatedData);
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
	async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
		return await this.findById(id);
	}

	/**
	 * Update purchase order
	 */
	async updatePurchaseOrder(updates: Partial<PurchaseOrder> & { _id: string }): Promise<PurchaseOrder> {
		return await this.update(updates);
	}

	/**
	 * Hard delete purchase order (removes from collection)
	 */
	async removePurchaseOrder(id: string): Promise<PurchaseOrder> {
		return await this.remove(id);
	}

	/**
	 * Find purchase orders by partner ID
	 */
	async getPurchaseOrdersByPartnerId(partnerId: string): Promise<PurchaseOrder[]> {
		return await this.findByField('partnerId', partnerId);
	}

	/**
	 * Find purchase orders by status
	 */
	async getPurchaseOrdersByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
		return await this.findByField('status', status);
	}

	/**
	 * Count purchase orders by status
	 */
	async countPurchaseOrdersByStatus(status: PurchaseOrderStatus, options?: DataOperationOptions): Promise<number> {
		return await this.countByField('status', status, options);
	}
}