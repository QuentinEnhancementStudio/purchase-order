// Re-export backend types for frontend use
export type { 
  Partner, 
  ContactDetails, 
  BillingDetails, 
  Address, 
  PartnerStatus,
  PartnerInvitation,
  InvitationStatus 
} from '../../backend/types/entities/partner';

export type { 
  PurchaseOrder, 
  PurchaseOrderStatus, 
  PurchaseOrderHistory,
  OrderConversionResult,
  CalculatedDraftOrder,
  DraftOrder,
  OrderLineItem,
  Price,
  PriceSummary
} from '../../backend/types/entities/purchase-order';

// @deprecated Use calculatedDraftOrder.draftOrder.lineItems instead
export type { PurchaseOrderItem } from '../../backend/types/entities/purchase-order';

export { 
  PurchaseOrderStatus as OrderStatus,
  NotificationType 
} from '../../backend/types/enums/purchase-order-status';

// Frontend-specific types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  hasMore: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// UI Component types
export interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}