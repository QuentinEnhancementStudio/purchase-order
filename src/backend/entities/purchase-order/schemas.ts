import { z } from 'zod';
import { WixEntityMetadataSchema } from '../../services/validation/schemas';

// Purchase Order Status Schema
export const PurchaseOrderStatusSchema = z.enum(['draft', 'pending', 'approved', 'rejected', 'canceled']);

// Base Field Schemas
export const IdentifierSchema = z.string().optional();

export const PartnerIdSchema = z.string().optional();

export const OrderIdSchema = z.string().optional();

export const DraftOrderIdSchema = z.string().optional();

export const LastUpdateSchema = z.coerce.date().optional();

export const PurchaseOrderBaseSchema = z.object({
  identifier: IdentifierSchema,
  partnerId: PartnerIdSchema,
  orderId: OrderIdSchema,
  draftOrderId: DraftOrderIdSchema,
  status: PurchaseOrderStatusSchema.default('draft'),
  lastUpdate: LastUpdateSchema,
});

// Base Purchase Order Schema (for full purchase order entity)
export const PurchaseOrderSchema = PurchaseOrderBaseSchema.and(WixEntityMetadataSchema);

// Export inferred types
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;
export type PurchaseOrderBase = z.infer<typeof PurchaseOrderBaseSchema>;
