export interface PurchaseOrder {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  _owner: string;
  identifier: string;
  status: PurchaseOrderStatus;
  orderId?: string;
  memberId: string;
  draftOrderId?: string;
  calculatedDraftOrder?: CalculatedDraftOrder;
  notes?: string;
  adminComments?: string;
  version: number;
}

// Wix DraftOrder API types for calculatedDraftOrder integration
export interface CalculatedDraftOrder {
  draftOrder: DraftOrder;
  shippingOptions?: ShippingOption[];
  calculationErrors?: CalculationErrors;
}

export interface DraftOrder {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  orderId: string;
  memberId?: string;
  currency: string;
  lineItems: OrderLineItem[];
  priceSummary: PriceSummary;
  status: 'DRAFT' | 'COMMITTED';
  billingDetails?: BillingDetails;
  shippingInfo?: ShippingInformation;
  buyerDetails?: BuyerDetails;
  discounts?: DiscountDetails[];
  additionalFees?: AdditionalFeeDetails[];
  taxInfo?: OrderTaxInfo;
  balanceSummary?: BalanceSummary;
  [key: string]: any; // Allow for additional Wix API fields
}

export interface OrderLineItem {
  _id: string;
  productName: { original: string; translated?: string };
  catalogReference?: {
    appId: string;
    catalogItemId: string;
    options?: Record<string, any>;
  };
  quantity: number;
  price: Price;
  priceBeforeDiscounts?: Price;
  totalPriceAfterTax: Price;
  totalPriceBeforeTax: Price;
  totalDiscount?: Price;
  taxInfo?: LineItemTaxInfo;
  physicalProperties?: {
    sku?: string;
    weight?: number;
    shippable?: boolean;
  };
  image?: string;
  descriptionLines?: DescriptionLine[];
  [key: string]: any; // Allow for additional Wix API fields
}

export interface Price {
  amount: string;
  formattedAmount: string;
}

export interface PriceSummary {
  subtotal: Price;
  shipping?: Price;
  tax?: Price;
  discount?: Price;
  total: Price;
  totalAdditionalFees?: Price;
}

export interface DescriptionLine {
  name: { original: string; translated?: string };
  plainText?: { original: string; translated?: string };
  colorInfo?: {
    original: string;
    translated?: string;
    code: string;
  };
}

export interface LineItemTaxInfo {
  taxAmount: Price;
  taxRate: string;
  taxableAmount: Price;
  taxIncludedInPrice: boolean;
  taxGroupId?: string;
}

export interface ShippingOption {
  code: string;
  title: string;
  cost: {
    price: Price;
    currency: string;
  };
  logistics: {
    deliveryTime?: string;
    instructions?: string;
  };
  carrierId?: string;
}

export interface CalculationErrors {
  orderValidationErrors?: ApplicationError[];
  taxCalculationError?: any;
  carrierErrors?: any;
  generalShippingCalculationError?: any;
}

export interface ApplicationError {
  code: string;
  description: string;
  data?: Record<string, any>;
}

// Additional interfaces for completeness
export interface BillingDetails {
  billingInfo: {
    address: Address;
    contactDetails: ContactDetails;
  };
}

export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  subdivision?: string;
}

export interface ContactDetails {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
}

export interface ShippingInformation {
  code?: string;
  title?: string;
  cost?: any;
  logistics?: any;
}

export interface BuyerDetails {
  buyerInfo: {
    contactId?: string;
    email?: string;
    memberId?: string;
    visitorId?: string;
  };
}

export interface DiscountDetails {
  discount: {
    _id: string;
    discountType: 'GLOBAL' | 'SPECIFIC_ITEMS' | 'SHIPPING';
    coupon?: any;
    discountRule?: any;
    merchantDiscount?: any;
  };
  applied: boolean;
}

export interface AdditionalFeeDetails {
  additionalFee: {
    _id: string;
    name: string;
    code: string;
    price: Price;
    priceAfterTax?: Price;
    priceBeforeTax?: Price;
  };
  applied: boolean;
}

export interface OrderTaxInfo {
  totalTax: Price;
  taxExempt?: boolean;
  taxBreakdown?: any[];
}

export interface BalanceSummary {
  balance: {
    amount: string;
    formattedAmount: string;
  };
  paid?: Price;
  authorized?: Price;
  refunded?: Price;
}

// Deprecated: Items are now managed through calculatedDraftOrder.draftOrder.lineItems
// @deprecated Use calculatedDraftOrder.draftOrder.lineItems instead
export interface PurchaseOrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  sku?: string;
  customizations?: Record<string, any>;
}

import { PurchaseOrderStatus } from '../enums/purchase-order-status';
export { PurchaseOrderStatus };

export interface PurchaseOrderHistory {
  id: string;
  purchaseOrderId: string;
  status: PurchaseOrderStatus;
  changedBy: string;
  changeDate: Date;
  comments?: string;
  previousStatus?: PurchaseOrderStatus;
}

export interface OrderConversionResult {
  success: boolean;
  orderId?: string;
  draftOrderId?: string;
  error?: string;
}