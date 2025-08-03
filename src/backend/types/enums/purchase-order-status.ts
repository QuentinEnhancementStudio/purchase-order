export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  MODIFICATION_REQUESTED = 'modification_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum PartnerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export enum NotificationType {
  ORDER_SUBMITTED = 'order_submitted',
  ORDER_APPROVED = 'order_approved',
  ORDER_REJECTED = 'order_rejected',
  MODIFICATION_REQUESTED = 'modification_requested',
  PARTNER_INVITED = 'partner_invited'
}