import { PurchaseOrderStatus } from '../../types/entities/purchase-order';

export class PurchaseOrderStateMachine {
  private static readonly transitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.SUBMITTED],
    [PurchaseOrderStatus.SUBMITTED]: [PurchaseOrderStatus.UNDER_REVIEW, PurchaseOrderStatus.REJECTED],
    [PurchaseOrderStatus.UNDER_REVIEW]: [PurchaseOrderStatus.MODIFICATION_REQUESTED, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED],
    [PurchaseOrderStatus.MODIFICATION_REQUESTED]: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SUBMITTED],
    [PurchaseOrderStatus.APPROVED]: [],
    [PurchaseOrderStatus.REJECTED]: []
  };

  static canTransition(currentStatus: PurchaseOrderStatus, newStatus: PurchaseOrderStatus): boolean {
    const allowedTransitions = this.transitions[currentStatus];
    return allowedTransitions?.includes(newStatus) || false;
  }

  static getAvailableTransitions(currentStatus: PurchaseOrderStatus): PurchaseOrderStatus[] {
    return this.transitions[currentStatus] || [];
  }

  static isTerminalStatus(status: PurchaseOrderStatus): boolean {
    return [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED].includes(status);
  }

  static canModify(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.DRAFT;
  }

  static getStatusDisplayName(status: PurchaseOrderStatus): string {
    const displayNames: Record<PurchaseOrderStatus, string> = {
      [PurchaseOrderStatus.DRAFT]: 'Draft',
      [PurchaseOrderStatus.SUBMITTED]: 'Submitted',
      [PurchaseOrderStatus.UNDER_REVIEW]: 'Under Review',
      [PurchaseOrderStatus.MODIFICATION_REQUESTED]: 'Modification Requested',
      [PurchaseOrderStatus.APPROVED]: 'Approved',
      [PurchaseOrderStatus.REJECTED]: 'Rejected'
    };

    return displayNames[status] || status;
  }

  static getStatusColor(status: PurchaseOrderStatus): string {
    const colors: Record<PurchaseOrderStatus, string> = {
      [PurchaseOrderStatus.DRAFT]: 'gray',
      [PurchaseOrderStatus.SUBMITTED]: 'blue',
      [PurchaseOrderStatus.UNDER_REVIEW]: 'orange',
      [PurchaseOrderStatus.MODIFICATION_REQUESTED]: 'yellow',
      [PurchaseOrderStatus.APPROVED]: 'green',
      [PurchaseOrderStatus.REJECTED]: 'red'
    };

    return colors[status] || 'gray';
  }
}