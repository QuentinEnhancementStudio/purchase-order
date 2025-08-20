import {
  type PurchaseOrder,
} from './schemas';

// Shared constant for status transition rules - single source of truth
export const ALLOWED_TRANSITIONS: Record<NonNullable<PurchaseOrder['status']>, NonNullable<PurchaseOrder['status']>[]> = {
  draft: ['pending', 'canceled'],
  pending: ['approved', 'rejected', 'canceled'],
  approved: ['canceled'],
  rejected: [],
  canceled: []
};

/**
 * Purchase order status validation with business logic
 */
export function validateStatusTransition(currentStatus: PurchaseOrder['status'], newStatus: PurchaseOrder['status']): boolean {
  if (!currentStatus || !newStatus) {
    return false;
  }

  return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}