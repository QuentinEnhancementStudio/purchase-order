import { type PurchaseOrder} from './schemas';
import { ALLOWED_TRANSITIONS } from './validation';

/**
 * Purchase order business logic and entity behaviors
 * Contains functions that define what a PurchaseOrder can do and how it behaves
 */

/**
 * Business logic: Get display-friendly status name
 */
export function getStatusDisplayName(status: PurchaseOrder['status']): string {
  if (!status) {
    return 'Unknown';
  }

  const statusMap = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    canceled: 'Canceled'
  };
  return statusMap[status] || status;
}

/**
 * Business logic: Get available status transitions for a purchase order
 */
export function getAvailableStatusTransitions(currentStatus: PurchaseOrder['status']): NonNullable<PurchaseOrder['status']>[] {
  if (!currentStatus) {
    return [];
  }
  
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Business logic: Format purchase order data for display purposes
 */
export function formatPurchaseOrderForDisplay(purchaseOrder: PurchaseOrder) {
  return {
    ...purchaseOrder,
    statusDisplayName: getStatusDisplayName(purchaseOrder.status),
  };
}