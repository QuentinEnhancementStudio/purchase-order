// Re-export backend types for frontend use
export type { 
  Partner, 
  PartnerStatus,
  PartnerBase
} from '../../backend/entities/partner/schemas';

export type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderBase
} from '../../backend/entities/purchase-order/schemas';
