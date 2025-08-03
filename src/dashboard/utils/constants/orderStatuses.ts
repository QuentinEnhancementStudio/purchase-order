import { PurchaseOrderStatus } from '../../../backend/types/enums/purchase-order-status';

export const ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'Draft',
  [PurchaseOrderStatus.SUBMITTED]: 'Submitted',
  [PurchaseOrderStatus.UNDER_REVIEW]: 'Under Review',
  [PurchaseOrderStatus.MODIFICATION_REQUESTED]: 'Modification Requested',
  [PurchaseOrderStatus.APPROVED]: 'Approved',
  [PurchaseOrderStatus.REJECTED]: 'Rejected',
};

export const ORDER_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: '#6B7280',
  [PurchaseOrderStatus.SUBMITTED]: '#3B82F6',
  [PurchaseOrderStatus.UNDER_REVIEW]: '#F59E0B',
  [PurchaseOrderStatus.MODIFICATION_REQUESTED]: '#EAB308',
  [PurchaseOrderStatus.APPROVED]: '#10B981',
  [PurchaseOrderStatus.REJECTED]: '#EF4444',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'Order is being prepared and can be modified',
  [PurchaseOrderStatus.SUBMITTED]: 'Order has been submitted and is awaiting review',
  [PurchaseOrderStatus.UNDER_REVIEW]: 'Order is currently being reviewed by admin',
  [PurchaseOrderStatus.MODIFICATION_REQUESTED]: 'Admin has requested changes to the order',
  [PurchaseOrderStatus.APPROVED]: 'Order has been approved and converted to Wix order',
  [PurchaseOrderStatus.REJECTED]: 'Order has been rejected and cannot be processed',
};

export const TERMINAL_STATUSES: PurchaseOrderStatus[] = [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED];

export const EDITABLE_STATUSES: PurchaseOrderStatus[] = [PurchaseOrderStatus.DRAFT];

export const ADMIN_ACTION_STATUSES: PurchaseOrderStatus[] = [PurchaseOrderStatus.SUBMITTED, PurchaseOrderStatus.UNDER_REVIEW];

export const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.SUBMITTED],
  [PurchaseOrderStatus.SUBMITTED]: [PurchaseOrderStatus.UNDER_REVIEW, PurchaseOrderStatus.MODIFICATION_REQUESTED, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED],
  [PurchaseOrderStatus.UNDER_REVIEW]: [PurchaseOrderStatus.MODIFICATION_REQUESTED, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED],
  [PurchaseOrderStatus.MODIFICATION_REQUESTED]: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SUBMITTED],
  [PurchaseOrderStatus.APPROVED]: [],
  [PurchaseOrderStatus.REJECTED]: [],
};

export const getAvailableStatusTransitions = (currentStatus: PurchaseOrderStatus): PurchaseOrderStatus[] => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};

export const canTransitionToStatus = (
  currentStatus: PurchaseOrderStatus,
  targetStatus: PurchaseOrderStatus
): boolean => {
  return getAvailableStatusTransitions(currentStatus).includes(targetStatus);
};