import { webMethod, Permissions } from '@wix/web-methods';
import { PurchaseOrderEntity } from '../entities/purchase-order/purchase-order';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders/purchase-orders';
import { PurchaseOrderStatus } from '../types/enums/purchase-order-status';
import { PurchaseOrder } from '../types/entities/purchase-order';

// Global repository instance - reused across all web methods
const purchaseOrdersRepository = new PurchaseOrdersRepository();

export const getPurchaseOrders = webMethod(
  Permissions.SiteMember,
  async (): Promise<PurchaseOrder[]> => {
    try {
      // For now, return all orders - in a real implementation, this would check permissions
      const orders = await purchaseOrdersRepository.getAllPurchaseOrders();
      return orders;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw new Error('Failed to fetch purchase orders');
    }
  }
);

export const getPurchaseOrderById = webMethod(
  Permissions.SiteMember,
  async (orderId: string): Promise<PurchaseOrder> => {
    try {
      const order = await purchaseOrdersRepository.getPurchaseOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      throw new Error('Failed to fetch purchase order');
    }
  }
);

export const createPurchaseOrder = webMethod(
  Permissions.SiteMember,
  async (orderData: any): Promise<PurchaseOrder> => {
    try {
      // Validate input
      const validationResult = PurchaseOrderEntity.validateCreateInput(orderData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors?.join(', ') || 'Validation failed');
      }

      // Create order with default status
      const order = await purchaseOrdersRepository.createPurchaseOrder({
        ...orderData,
        memberId: 'current_member', // This would come from context in real implementation
        status: 'draft'
      });
      
      return order;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw new Error('Failed to create purchase order');
    }
  }
);

export const updatePurchaseOrderStatus = webMethod(
  Permissions.Admin,
  async (orderId: string, status: string, comments?: string): Promise<PurchaseOrder> => {
    try {
      const updatedOrder = await purchaseOrdersRepository.updatePurchaseOrderStatus(orderId, status as any, comments);
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }
);

export const getPurchaseOrdersByPartner = webMethod(
  Permissions.Admin,
  async (partnerId: string): Promise<PurchaseOrder[]> => {
    try {
      const orders = await purchaseOrdersRepository.getPurchaseOrdersByMemberId(partnerId);
      return orders;
    } catch (error) {
      console.error('Error fetching partner orders:', error);
      throw new Error('Failed to fetch partner orders');
    }
  }
);

export const getPurchaseOrdersByStatus = webMethod(
  Permissions.Admin,
  async (status: string): Promise<PurchaseOrder[]> => {
    try {
      const orders = await purchaseOrdersRepository.getPurchaseOrdersByStatus(status as PurchaseOrderStatus);
      return orders;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw new Error('Failed to fetch orders by status');
    }
  }
);