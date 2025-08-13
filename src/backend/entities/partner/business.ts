import { type Partner} from './schemas';

/**
 * Partner business logic and entity behaviors
 * Contains functions that define what a Partner can do and how it behaves
 */

/**
 * Business logic: Check if partner is active
 */
export function isActive(partner: Partner): boolean {
  return partner.status === 'active';
}

/**
 * Business logic: Check if partner can create orders
 */
export function canCreateOrders(partner: Partner): boolean {
  return isActive(partner) && partner.globalDiscountPercentage !== undefined && partner.globalDiscountPercentage >= 0;
}

/**
 * Business logic: Calculate discounted price with partner
 */
export function calculateDiscountedPrice(originalPrice: number, partner: Partner): number {
  if (!isActive(partner) || !partner.globalDiscountPercentage || partner.globalDiscountPercentage <= 0 || partner.globalDiscountPercentage > 100) {
    return originalPrice;
  }

  return originalPrice * (1 - partner.globalDiscountPercentage / 100);
}

/**
 * Business logic: Get display-friendly status name
 */
export function getStatusDisplayName(status: Partner['status']): string {
  const statusMap = {
    active: 'Active',
    pending: 'Pending',
    inactive: 'Inactive'
  };
  return statusMap[status] || status;
}

/**
 * Business logic: Get available status transitions for a partner
 */
export function getAvailableStatusTransitions(currentStatus: Partner['status']): Partner['status'][] {
  const allowedTransitions: Record<Partner['status'], Partner['status'][]> = {
    pending: ['active', 'inactive'],
    active: ['inactive'],
    inactive: ['active']
  };
  
  return allowedTransitions[currentStatus] || [];
}

/**
 * Business logic: Format partner data for display purposes
 */
export function formatPartnerForDisplay(partner: Partner) {
  return {
    ...partner,
    formattedDiscount: `${partner.globalDiscountPercentage || 0}%`,
    statusDisplayName: getStatusDisplayName(partner.status),
  };
}