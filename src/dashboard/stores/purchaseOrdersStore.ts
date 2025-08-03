import { makeAutoObservable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus
} from '../../backend/web-methods/purchase-orders.web';

interface PurchaseOrderFilter {
  status?: PurchaseOrderStatus | null;
  partnerId?: string | null;
}

export class PurchaseOrdersStore {
  purchaseOrders = new Map<string, PurchaseOrder>();
  error: string | null = null;
  
  // Observable promises for reactive request states - initialized as resolved with empty arrays/objects
  loadPurchaseOrdersRequest: IPromiseBasedObservable<PurchaseOrder[]> = fromPromise.resolve([]);
  createPurchaseOrderRequest: IPromiseBasedObservable<PurchaseOrder> = fromPromise.resolve({} as PurchaseOrder);
  updatePurchaseOrderStatusRequest: IPromiseBasedObservable<PurchaseOrder> = fromPromise.resolve({} as PurchaseOrder);
  
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
        () => this.loadPurchaseOrdersRequest,
        (request) => {
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: PurchaseOrder[]) => {
              if (response) {
                runInAction(() => {
                  this.purchaseOrders.clear();
                  response.forEach((order: PurchaseOrder) => {
                    this.purchaseOrders.set(order._id, order);
                  });
                });
              }
            },
            rejected: (error: any) => {
              console.error('Error loading purchase orders:', error);
              this.error = 'Failed to load purchase orders';
            }
          });
        }
      )
    );

    // Reaction for create purchase order requests
    this.reactionDisposers.push(
      reaction(
        () => this.createPurchaseOrderRequest,
        (request) => {
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: PurchaseOrder) => {
              if (response) {
                runInAction(() => {
                  this.purchaseOrders.set(response._id, response);
                });
              }
            },
            rejected: (error: any) => {
              console.error('Error creating purchase order:', error);
              this.error = 'Failed to create purchase order';
            }
          });
        }
      )
    );

    // Reaction for update purchase order status requests
    this.reactionDisposers.push(
      reaction(
        () => this.updatePurchaseOrderStatusRequest,
        (request) => {
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: PurchaseOrder) => {
              if (response) {
                runInAction(() => {
                  this.purchaseOrders.set(response._id, response);
                });
              }
            },
            rejected: (error: any) => {
              console.error('Error updating purchase order status:', error);
              this.error = 'Failed to update purchase order status';
            }
          });
        }
      )
    );
  }

  loadPurchaseOrders(): void {
    const promise = getPurchaseOrders();
    this.loadPurchaseOrdersRequest = fromPromise(promise);
  }

  updatePurchaseOrderStatus(purchaseOrderId: string, status: PurchaseOrderStatus, comments?: string): void {
    const promise = updatePurchaseOrderStatus(purchaseOrderId, status, comments);
    this.updatePurchaseOrderStatusRequest = fromPromise(promise);
  }

  createPurchaseOrder(orderData: any): void {
    const promise = createPurchaseOrder(orderData);
    this.createPurchaseOrderRequest = fromPromise(promise);
  }


  getFilteredPurchaseOrders(filter: PurchaseOrderFilter = {}): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values()).filter(purchaseOrder => {
      if (filter.status && purchaseOrder.status !== filter.status) {
        return false;
      }
      if (filter.partnerId && purchaseOrder.memberId !== filter.partnerId) {
        return false;
      }
      return true;
    });
  }

  getPendingPurchaseOrders(): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values()).filter(purchaseOrder => 
      ['submitted', 'under_review'].includes(purchaseOrder.status)
    );
  }

  getPurchaseOrdersRequiringAction(): PurchaseOrder[] {
    return this.getFilteredPurchaseOrders({ status: 'submitted' as PurchaseOrderStatus });
  }

  getPurchaseOrdersByStatus(status: PurchaseOrderStatus): PurchaseOrder[] {
    return this.getFilteredPurchaseOrders({ status });
  }

  getPurchaseOrdersByPartner(partnerId: string): PurchaseOrder[] {
    return this.getFilteredPurchaseOrders({ partnerId });
  }

  get purchaseOrdersCount(): number {
    return this.purchaseOrders.size;
  }

  get purchaseOrdersAsArray(): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values());
  }

  getPendingPurchaseOrdersCount(): number {
    return this.getPendingPurchaseOrders().length;
  }

  getFilteredPurchaseOrdersCount(filter: PurchaseOrderFilter = {}): number {
    return this.getFilteredPurchaseOrders(filter).length;
  }

  getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  get isLoading(): boolean {
    return (this.loadPurchaseOrdersRequest.state === 'pending') || 
           (this.createPurchaseOrderRequest.state === 'pending') ||
           (this.updatePurchaseOrderStatusRequest.state === 'pending');
  }
  
  get isLoadingPurchaseOrders(): boolean {
    return this.loadPurchaseOrdersRequest.state === 'pending';
  }
  
  get isCreatingPurchaseOrder(): boolean {
    return this.createPurchaseOrderRequest.state === 'pending';
  }
  
  get isUpdatingPurchaseOrderStatus(): boolean {
    return this.updatePurchaseOrderStatusRequest.state === 'pending';
  }


  dispose() {
    // Clean up reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
  }
}