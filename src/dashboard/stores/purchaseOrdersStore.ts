import { makeAutoObservable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { orderBy } from 'lodash';
import { PurchaseOrder, PurchaseOrderBase } from '../types';
import {
  queryPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder
} from '../../backend/web-methods/purchase-orders.web';
import { AppError } from '../services/AppError/AppError';
import { ErrorCategory } from '../services/AppError/ErrorCategories';

export interface PurchaseOrderFilter {
  status?: string | null;
  partnerId?: string | null;
  keyword?: string | null;
}

export interface PurchaseOrderSorting {
  field: 'identifier' | 'partnerId' | 'orderId' | 'status' | 'lastUpdate' | '_createdDate' | '_updatedDate';
  direction: 'asc' | 'desc';
}

// Optimistic operation type with methods for resolving/rejecting
// Methods have direct access to store via closures - no parameter passing needed
type OptimisticOperation = {
  operationId: string;
  resolve: (response: PurchaseOrder) => void;
  reject: () => void;
}

/**
 * PurchaseOrdersStore - Manages purchase order data with optional optimistic updates
 * 
 * Two operation modes:
 * 1. Regular operations: updatePurchaseOrder(), deletePurchaseOrder() - traditional flow with loading states
 * 2. Optimistic operations: updatePurchaseOrderOptimistic(), deletePurchaseOrderOptimistic() - immediate UI updates with rollback on failure
 */
export class PurchaseOrdersStore {
  purchaseOrders = new Map<string, PurchaseOrder>();
  error: AppError | null = null;
  
  // Transaction log for optimistic updates rollback support
  // Key: operationId, Value: operation details
  private optimisticOperations = new Map<string, OptimisticOperation>();
  
  // Observable promises for reactive request states - initialized as resolved with empty arrays/objects
  loadPurchaseOrdersRequest: IPromiseBasedObservable<PurchaseOrder[]> = fromPromise.resolve([]);
  updatePurchaseOrderRequest: IPromiseBasedObservable<PurchaseOrder> = fromPromise.resolve({} as PurchaseOrder);
  deletePurchaseOrderRequest: IPromiseBasedObservable<PurchaseOrder> = fromPromise.resolve({} as PurchaseOrder);

  // Reaction disposers for cleanup
  private reactionDisposers: IReactionDisposer[] = [];

  constructor() {
    makeAutoObservable(this);
    this.setupReactions();
  }

  private setupReactions() {
    // Reaction for load purchase orders requests
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.loadPurchaseOrdersRequest.state, value: this.loadPurchaseOrdersRequest.value }),
        () => {
          const request = this.loadPurchaseOrdersRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: PurchaseOrder[]) => {
              if (response) {
                runInAction(() => {
                  this.purchaseOrders.clear();
                  response.forEach((purchaseOrder: PurchaseOrder) => {
                    this.purchaseOrders.set(purchaseOrder._id, purchaseOrder);
                  });
                });
              }
            },
            rejected: (error: any) => {
              // Check if this is a serialized AppError from backend
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  // Fallback to wrapping if reconstruction fails
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to load purchase orders',
                    technicalMessage: `Error loading purchase orders: ${error?.message || 'Unknown error'}`,
                    source: 'PurchaseOrdersStore.loadPurchaseOrders',
                    layer: 'Store',
                    context: { operation: 'loadPurchaseOrders' }
                  });
                }
              } else {
                // Wrap non-AppError instances as before
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to load purchase orders',
                  technicalMessage: `Error loading purchase orders: ${error?.message || 'Unknown error'}`,
                  source: 'PurchaseOrdersStore.loadPurchaseOrders',
                  layer: 'Store',
                  context: { operation: 'loadPurchaseOrders' }
                });
              }
            }
          });
        }
      )
    );

    // Reaction for update purchase order requests with optimistic operation handling
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.updatePurchaseOrderRequest.state, value: this.updatePurchaseOrderRequest.value }),
        () => {
          const request = this.updatePurchaseOrderRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: PurchaseOrder & { operationId?: string }) => {
              if (response) {
                runInAction(() => {
                  if (response.operationId && this.optimisticOperations.has(response.operationId)) {
                    // Optimistic flow: delegate to self-managing operation
                    const operation = this.optimisticOperations.get(response.operationId)!;
                    operation.resolve(response);
                  } else {
                    // Non-optimistic flow: regular purchase order update
                    this.purchaseOrders.set(response._id, response);
                  }
                });
              }
            },
            rejected: (error: any) => {
              runInAction(() => {
                // Precise rollback: delegate to self-managing operation
                if (error.operationId && this.optimisticOperations.has(error.operationId)) {
                  const operation = this.optimisticOperations.get(error.operationId)!;
                  operation.reject();
                }
                // If no operationId in error, no optimistic operation to rollback
              });

              // Handle error as before
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to update purchase order',
                    technicalMessage: `Error updating purchase order: ${error?.message || 'Unknown error'}`,
                    source: 'PurchaseOrdersStore.updatePurchaseOrder',
                    layer: 'Store',
                    context: { operation: 'updatePurchaseOrder' }
                  });
                }
              } else {
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to update purchase order',
                  technicalMessage: `Error updating purchase order: ${error?.message || 'Unknown error'}`,
                  source: 'PurchaseOrdersStore.updatePurchaseOrder',
                  layer: 'Store',
                  context: { operation: 'updatePurchaseOrder' }
                });
              }
            }
          });
        }
      )
    );

    // Reaction for delete purchase order requests
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.deletePurchaseOrderRequest.state, value: this.deletePurchaseOrderRequest.value }),
        () => {
          const request = this.deletePurchaseOrderRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: PurchaseOrder & { operationId?: string }) => {
              if (response) {
                runInAction(() => {
                  if (response.operationId && this.optimisticOperations.has(response.operationId)) {
                    // Optimistic flow: delegate to self-managing operation
                    const operation = this.optimisticOperations.get(response.operationId)!;
                    operation.resolve(response);
                  } else {
                    // Non-optimistic flow: regular purchase order deletion
                    this.purchaseOrders.delete(response._id);
                  }
                });
              }
            },
            rejected: (error: any) => {
              runInAction(() => {
                // Precise rollback: delegate to self-managing operation
                if (error.operationId && this.optimisticOperations.has(error.operationId)) {
                  const operation = this.optimisticOperations.get(error.operationId)!;
                  operation.reject();
                }
                // If no operationId in error, no optimistic operation to rollback
              });

              // Check if this is a serialized AppError from backend
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  // Fallback to wrapping if reconstruction fails
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to delete purchase order',
                    technicalMessage: `Error deleting purchase order: ${error?.message || 'Unknown error'}`,
                    source: 'PurchaseOrdersStore.deletePurchaseOrder',
                    layer: 'Store',
                    context: { operation: 'deletePurchaseOrder' }
                  });
                }
              } else {
                // Wrap non-AppError instances as before
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to delete purchase order',
                  technicalMessage: `Error deleting purchase order: ${error?.message || 'Unknown error'}`,
                  source: 'PurchaseOrdersStore.deletePurchaseOrder',
                  layer: 'Store',
                  context: { operation: 'deletePurchaseOrder' }
                });
              }
            }
          });
        }
      )
    );

    // Reaction for error handling
    this.reactionDisposers.push(
      reaction(
        () => this.error,
        (reason) => reason?.log(),
      )
    );
  }

  loadPurchaseOrders(): void {
    const promise = queryPurchaseOrders();
    this.loadPurchaseOrdersRequest = fromPromise(promise);
  }
  
  updatePurchaseOrder(purchaseOrderToUpdate: PurchaseOrder): void {
    const promise = updatePurchaseOrder(purchaseOrderToUpdate);
    this.updatePurchaseOrderRequest = fromPromise(promise);
  }

  updatePurchaseOrderOptimistic(purchaseOrderToUpdate: PurchaseOrder): void {
    const purchaseOrderId = purchaseOrderToUpdate._id;
    const previousState = this.purchaseOrders.get(purchaseOrderId);
    
    // Create self-managing operation
    const operation = this.createOptimisticOperation(
      // Resolve: update with server response
      (response) => {
        this.purchaseOrders.set(response._id, response);
      },
      // Reject: restore previous state
      () => {
        this.purchaseOrders.set(purchaseOrderId, previousState!);
      }
    );
    
    // Perform the optimistic update
    const optimisticPurchaseOrder = { ...purchaseOrderToUpdate };
    this.purchaseOrders.set(purchaseOrderId, optimisticPurchaseOrder);
    
    // Make actual API call with operationId - reactions will handle success/failure
    const promise = updatePurchaseOrder(purchaseOrderToUpdate, operation.operationId);
    this.updatePurchaseOrderRequest = fromPromise(promise);
  }

  deletePurchaseOrder(id: string): void {
    const promise = deletePurchaseOrder(id); // No operationId = non-optimistic
    this.deletePurchaseOrderRequest = fromPromise(promise);
  }

  // Optimistic purchase order deletion - immediate UI feedback with rollback on failure
  deletePurchaseOrderOptimistic(id: string): void {
    const purchaseOrderToDelete = this.purchaseOrders.get(id);
    
    if (purchaseOrderToDelete) {
      // Create self-managing operation
      const operation = this.createOptimisticOperation(
        // Resolve: purchase order already deleted optimistically, nothing to do
        () => {
          // Nothing needed - purchase order already removed optimistically
        },
        // Reject: restore deleted purchase order
        () => {
          this.purchaseOrders.set(purchaseOrderToDelete._id, purchaseOrderToDelete);
        }
      );
      
      // Perform the optimistic delete (remove from UI immediately)
      this.purchaseOrders.delete(id);
      
      // Make actual API call with operationId - reactions will handle success/failure
      const promise = deletePurchaseOrder(id, operation.operationId);
      this.deletePurchaseOrderRequest = fromPromise(promise);
    }
  }

  getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  getFilteredPurchaseOrders(filter: PurchaseOrderFilter = {}): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values()).filter(purchaseOrder => {
      if (filter.status && filter.status.trim() !== '' && purchaseOrder.status !== filter.status) {
        return false;
      }
      if (filter.partnerId && filter.partnerId.trim() !== '' && purchaseOrder.partnerId !== filter.partnerId) {
        return false;
      }
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        return (
          purchaseOrder._id.toLowerCase().includes(keyword) ||
          purchaseOrder.identifier?.toLowerCase().includes(keyword) ||
          purchaseOrder.orderId?.toLowerCase().includes(keyword) ||
          purchaseOrder.partnerId?.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }

  getFilteredSortedPurchaseOrders(filter: PurchaseOrderFilter = {}, sorting: PurchaseOrderSorting): PurchaseOrder[] {
    const filteredPurchaseOrders = this.getFilteredPurchaseOrders(filter);
    
    return orderBy(filteredPurchaseOrders, [sorting.field], [sorting.direction]);
  }

  getPurchaseOrdersCount(): number {
    return this.purchaseOrders.size;
  }

  getFilteredPurchaseOrdersCount(filter: PurchaseOrderFilter = {}): number {
    return this.getFilteredPurchaseOrders(filter).length;
  }

  clearError(): void {
    this.error = null;
  }

  get purchaseOrdersAsArray(): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values());
  }

  get isLoading(): boolean {
    return (this.loadPurchaseOrdersRequest.state === 'pending') ||
           (this.updatePurchaseOrderRequest.state === 'pending') ||
           (this.deletePurchaseOrderRequest.state === 'pending'); 
  }
  
  get isLoadingPurchaseOrders(): boolean {
    return this.loadPurchaseOrdersRequest.state === 'pending';
  }
  
  get isUpdatingPurchaseOrder(): boolean {
    return this.updatePurchaseOrderRequest.state === 'pending';
  }
  
  get isDeletingPurchaseOrder(): boolean {
    return this.deletePurchaseOrderRequest.state === 'pending';
  }

  // Base method to create self-managing optimistic operations
  private createOptimisticOperation(
    onResolve: (response: PurchaseOrder) => void,
    onReject: () => void
  ): OptimisticOperation {
    // Generate unique operation ID internally
    const operationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const operation: OptimisticOperation = {
      operationId,
      resolve: (response: PurchaseOrder) => {
        runInAction(() => {
          onResolve(response);
          // Self-remove from operations list on resolve
          this.optimisticOperations.delete(operationId);
        });
      },
      reject: () => {
        runInAction(() => {
          onReject();
          // Self-remove from operations list on reject
          this.optimisticOperations.delete(operationId);
        });
      }
    };
    
    // Self-add to operations list on creation
    this.optimisticOperations.set(operationId, operation);
    
    return operation;
  }

  dispose() {
    // Clean up reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
  }
}