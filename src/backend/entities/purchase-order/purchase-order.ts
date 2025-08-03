import { PurchaseOrder, CalculatedDraftOrder, OrderLineItem, Price } from '../../types/entities/purchase-order';

export class PurchaseOrderEntity {
  static validateCreateInput(data: Partial<PurchaseOrder>): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!data.identifier || data.identifier.trim().length === 0) {
      errors.push('Order identifier is required');
    }

    if (!data.memberId || data.memberId.trim().length === 0) {
      errors.push('Member ID is required');
    }

    // Note: Items validation is now handled by Wix DraftOrder API
    // If draftOrderId is provided, items should be managed through that
    if (data.draftOrderId && data.calculatedDraftOrder) {
      const lineItems = data.calculatedDraftOrder.draftOrder?.lineItems;
      if (!lineItems || lineItems.length === 0) {
        errors.push('Draft order must contain at least one line item');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Calculates order total from DraftOrder line items
   * @param calculatedDraftOrder - The calculated draft order from Wix API
   * @returns Total amount as number (parsed from Price.amount)
   */
  static calculateOrderTotal(calculatedDraftOrder?: CalculatedDraftOrder): number {
    if (!calculatedDraftOrder?.draftOrder?.priceSummary?.total) {
      return 0;
    }
    
    // Parse the total amount from Wix Price format
    const totalAmount = parseFloat(calculatedDraftOrder.draftOrder.priceSummary.total.amount);
    return isNaN(totalAmount) ? 0 : totalAmount;
  }

  /**
   * Gets line items from the calculated draft order
   * @param calculatedDraftOrder - The calculated draft order from Wix API
   * @returns Array of line items or empty array
   */
  static getLineItems(calculatedDraftOrder?: CalculatedDraftOrder): OrderLineItem[] {
    return calculatedDraftOrder?.draftOrder?.lineItems || [];
  }

  /**
   * Gets total item count from line items
   * @param calculatedDraftOrder - The calculated draft order from Wix API
   * @returns Total quantity of all items
   */
  static getTotalItemCount(calculatedDraftOrder?: CalculatedDraftOrder): number {
    const lineItems = this.getLineItems(calculatedDraftOrder);
    return lineItems.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Checks if order has any line items
   * @param calculatedDraftOrder - The calculated draft order from Wix API
   * @returns True if order has items
   */
  static hasItems(calculatedDraftOrder?: CalculatedDraftOrder): boolean {
    return this.getLineItems(calculatedDraftOrder).length > 0;
  }

  static generateIdentifier(memberId: string): string {
    const timestamp = Date.now().toString(36);
    const memberPrefix = memberId.slice(-4);
    return `PO-${memberPrefix}-${timestamp}`;
  }

  /**
   * Formats a Wix Price object for display
   * @param price - Wix Price object
   * @returns Formatted price string or fallback
   */
  static formatPrice(price?: Price): string {
    return price?.formattedAmount || price?.amount || '0';
  }

  /**
   * Parses a Wix Price amount to number
   * @param price - Wix Price object
   * @returns Numeric amount or 0
   */
  static parsePrice(price?: Price): number {
    if (!price?.amount) return 0;
    const parsed = parseFloat(price.amount);
    return isNaN(parsed) ? 0 : parsed;
  }
}