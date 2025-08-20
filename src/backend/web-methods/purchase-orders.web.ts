import { webMethod, Permissions } from '@wix/web-methods';
import { z } from 'zod';
import { validateStatusTransition } from '../entities/purchase-order';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders';
import { ValidationService } from '../services/validation';
import { PurchaseOrder, PurchaseOrderSchema } from '../entities/purchase-order/schemas';
import { PaginationSchema } from '../services/validation';
import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';
import { handleWebMethodErrorResponse } from './utils';

const purchaseOrdersRepository = new PurchaseOrdersRepository();

const PurchaseOrderIdParamSchema = z.string().min(1, 'Purchase Order ID is required').trim();

// Purchase Order-specific sorting schema with allowed fields
const PurchaseOrderSortingSchema = z.object({
	field: z.enum(['identifier', 'partnerId', 'orderId', 'status', 'lastUpdate', '_createdDate', '_updatedDate']).default('_createdDate'),
	direction: z.enum(['asc', 'desc']).default('asc')
});

const QueryPurchaseOrdersFiltersSchema = z.object({
	status: z.enum(['draft', 'pending', 'approved', 'rejected', 'canceled']).optional(),
	partnerId: z.string().optional(),
	searchTerm: z.string().optional(),
	pagination: PaginationSchema.optional(),
	sorting: PurchaseOrderSortingSchema.optional()
}).optional();

// Type aliases for better readability
type QueryPurchaseOrdersFilters = z.infer<typeof QueryPurchaseOrdersFiltersSchema>;

/**
 * Get all purchase orders with optional filtering and pagination
 */
export const queryPurchaseOrders = webMethod(
	Permissions.Admin,
	async (filters?: QueryPurchaseOrdersFilters): Promise<PurchaseOrder[]> => {
		try {
			const validationResult = ValidationService.validate(QueryPurchaseOrdersFiltersSchema, filters, 'Query filters');
			if (!validationResult.success) {
				throw new AppError({
					category: ErrorCategory.INPUT,
					technicalMessage: `Invalid filters: ${validationResult.errors?.join(', ')}`,
					userMessage: 'Invalid filter parameters provided',
					source: 'queryPurchaseOrders',
					layer: 'webMethod',
					severity: ErrorSeverity.LOW,
					context: { filters, validationErrors: validationResult.errors }
				});
			}

			const validatedFilters = validationResult.data;

			if (validatedFilters && Object.keys(validatedFilters).length > 0) {
				// Use filtered query based on available filters
				let results = await purchaseOrdersRepository.getAllPurchaseOrders();

				// Apply status filter
				if (validatedFilters.status) {
					results = results.filter(order => order.status === validatedFilters.status);
				}

				// Apply partner ID filter
				if (validatedFilters.partnerId) {
					results = results.filter(order => order.partnerId === validatedFilters.partnerId);
				}

				// Apply search term filter (search in identifier and orderId)
				if (validatedFilters.searchTerm) {
					const searchLower = validatedFilters.searchTerm.toLowerCase();
					results = results.filter(order => 
						order.identifier?.toLowerCase().includes(searchLower) ||
						order.orderId?.toLowerCase().includes(searchLower)
					);
				}

				// Apply sorting
				if (validatedFilters.sorting) {
					const { field, direction } = validatedFilters.sorting;
					results.sort((a, b) => {
						const aValue = a[field as keyof PurchaseOrder];
						const bValue = b[field as keyof PurchaseOrder];
						
						if (aValue === undefined || aValue === null) return direction === 'asc' ? 1 : -1;
						if (bValue === undefined || bValue === null) return direction === 'asc' ? -1 : 1;
						
						const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
						return direction === 'asc' ? comparison : -comparison;
					});
				}

				// Apply pagination
				if (validatedFilters.pagination) {
					const { number, size } = validatedFilters.pagination;
					const startIndex = (number - 1) * size;
					results = results.slice(startIndex, startIndex + size);
				}

				return results;
			}

			// Return all purchase orders if no filters
			return await purchaseOrdersRepository.getAllPurchaseOrders();
		} catch (error) {
			return handleWebMethodErrorResponse(error, undefined, 'Failed to query purchase orders', 'queryPurchaseOrders', ErrorSeverity.MEDIUM);
		}
	}
);

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = webMethod(
	Permissions.Admin,
	async (purchaseOrderId: string, operationId?: string): Promise<(PurchaseOrder | null) & { operationId?: string }> => {
		try {
			const validationResult = ValidationService.validate(PurchaseOrderIdParamSchema, purchaseOrderId, 'Purchase Order ID');
			if (!validationResult.success) {
				throw new AppError({
					category: ErrorCategory.INPUT,
					technicalMessage: `Invalid purchase order ID: ${validationResult.errors?.join(', ')}`,
					userMessage: 'Invalid purchase order ID provided',
					source: 'getPurchaseOrderById',
					layer: 'webMethod',
					severity: ErrorSeverity.LOW,
					context: { purchaseOrderId, validationErrors: validationResult.errors }
				});
			}

			const purchaseOrder = await purchaseOrdersRepository.getPurchaseOrderById(validationResult.data!);
			
			if (!purchaseOrder) {
				return operationId ? { operationId } as any : null as any;
			}

			// Only include operationId in response if it was provided in request
			return operationId ? { ...purchaseOrder, operationId } : purchaseOrder as any;
		} catch (error) {
			return handleWebMethodErrorResponse(error, operationId, 'Failed to get purchase order by ID', 'getPurchaseOrderById', ErrorSeverity.MEDIUM);
		}
	}
);

/**
 * Update an existing purchase order
 */
export const updatePurchaseOrder = webMethod(
	Permissions.Admin,
	async (purchaseOrder: PurchaseOrder, operationId?: string): Promise<PurchaseOrder & { operationId?: string }> => {
		try {
			// Validate complete purchase order object using Zod schema
			const validationResult = ValidationService.validate(PurchaseOrderSchema, purchaseOrder, 'Purchase Order');
			if (!validationResult.success) {
				throw new AppError({
					category: ErrorCategory.INPUT,
					technicalMessage: `Invalid purchase order data: ${validationResult.errors?.join(', ')}`,
					userMessage: 'Invalid purchase order data provided',
					source: 'updatePurchaseOrder',
					layer: 'webMethod',
					severity: ErrorSeverity.LOW,
					context: { purchaseOrder, validationErrors: validationResult.errors }
				});
			}

			const validatedPurchaseOrder = validationResult.data!;

			// Check that purchase order exists
			const existingPurchaseOrder = await purchaseOrdersRepository.getPurchaseOrderById(validatedPurchaseOrder._id);
			if (!existingPurchaseOrder) {
				throw new Error('Purchase order not found');
			}

			// Validate status transition if status changed
			if (validatedPurchaseOrder.status !== existingPurchaseOrder.status) {
				const isValidTransition = validateStatusTransition(existingPurchaseOrder.status, validatedPurchaseOrder.status);
				if (!isValidTransition) {
					throw new Error(`Invalid status transition from ${existingPurchaseOrder.status} to ${validatedPurchaseOrder.status}`);
				}
			}

			// Update purchase order using repository
			const updatedPurchaseOrder = await purchaseOrdersRepository.updatePurchaseOrder(validatedPurchaseOrder);

			console.log(`Purchase order updated successfully: ${updatedPurchaseOrder.identifier || updatedPurchaseOrder._id} (${updatedPurchaseOrder._id})`);
			// Only include operationId in response if it was provided in request
			return operationId ? { ...updatedPurchaseOrder, operationId } : updatedPurchaseOrder;
		} catch (error) {
			return handleWebMethodErrorResponse(error, operationId, 'Failed to update purchase order', 'updatePurchaseOrder', ErrorSeverity.HIGH);
		}
	}
);

/**
 * Delete a purchase order (hard delete)
 */
export const deletePurchaseOrder = webMethod(
	Permissions.Admin,
	async (purchaseOrderId: string, operationId?: string): Promise<PurchaseOrder & { operationId?: string }> => {
		try {
			// Validate purchase order ID using Zod schema
			const validationResult = ValidationService.validate(PurchaseOrderIdParamSchema, purchaseOrderId, 'Purchase Order ID');
			if (!validationResult.success) {
				throw new AppError({
					category: ErrorCategory.INPUT,
					technicalMessage: `Invalid purchase order ID: ${validationResult.errors?.join(', ')}`,
					userMessage: 'Invalid purchase order ID provided',
					source: 'deletePurchaseOrder',
					layer: 'webMethod',
					severity: ErrorSeverity.LOW,
					context: { purchaseOrderId, validationErrors: validationResult.errors }
				});
			}

			const validatedPurchaseOrderId = validationResult.data!;

			// Get purchase order first to validate it exists
			const existingPurchaseOrder = await purchaseOrdersRepository.getPurchaseOrderById(validatedPurchaseOrderId);
			if (!existingPurchaseOrder) {
				throw new Error('Purchase order not found');
			}

			// Perform hard delete
			const deletedPurchaseOrder = await purchaseOrdersRepository.removePurchaseOrder(validatedPurchaseOrderId);

			console.log(`Purchase order deleted successfully: ${deletedPurchaseOrder.identifier || deletedPurchaseOrder._id} (${deletedPurchaseOrder._id})`);

			// Only include operationId in response if it was provided in request
			return operationId ? { ...deletedPurchaseOrder, operationId } : deletedPurchaseOrder;
		} catch (error) {
			return handleWebMethodErrorResponse(error, operationId, 'Failed to delete purchase order', 'deletePurchaseOrder', ErrorSeverity.HIGH);
		}
	}
);