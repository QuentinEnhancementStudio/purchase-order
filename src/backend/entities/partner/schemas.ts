import { z } from 'zod';
import { WixEntityMetadataSchema } from '../../services/validation';

// Constraint constants - single source of truth
export const COMPANY_NAME_MAX_LENGTH = 255;
export const COMPANY_NAME_MIN_LENGTH = 2;
export const EMAIL_MAX_LENGTH = 320;
export const DISCOUNT_MIN_VALUE = 0;
export const DISCOUNT_MAX_VALUE = 100;

// Partner Status Schema
export const PartnerStatusSchema = z.enum(['active', 'inactive', 'pending']);

// Base Field Schemas
export const CompanyNameSchema = z.string()
  .min(1, 'Company name is required')
  .max(COMPANY_NAME_MAX_LENGTH, `Company name cannot exceed ${COMPANY_NAME_MAX_LENGTH} characters`)
  .trim();

export const CompanyNameStrictSchema = z.string()
  .min(COMPANY_NAME_MIN_LENGTH, `Company name must be at least ${COMPANY_NAME_MIN_LENGTH} characters`)
  .max(COMPANY_NAME_MAX_LENGTH, `Company name cannot exceed ${COMPANY_NAME_MAX_LENGTH} characters`)
  .trim();

export const EmailSchema = z.email('Invalid email format')
  .max(EMAIL_MAX_LENGTH, `Email cannot exceed ${EMAIL_MAX_LENGTH} characters`)
  .trim()
  .toLowerCase();

export const MemberIdSchema = z.string().min(1, 'Member ID is required');

export const GlobalDiscountPercentageSchema = z.number()
  .min(DISCOUNT_MIN_VALUE, `Global discount percentage must be at least ${DISCOUNT_MIN_VALUE}`)
  .max(DISCOUNT_MAX_VALUE, `Global discount percentage cannot exceed ${DISCOUNT_MAX_VALUE}`);

export const PartnerBaseSchema = z.object({
  memberId: MemberIdSchema,
  companyName: CompanyNameSchema,
  status: PartnerStatusSchema.default('active'),
  catalogId: z.string().optional(),
  globalDiscountPercentage: GlobalDiscountPercentageSchema.default(0),
});

// Form schema with lenient validation for UX - extends base schema with overrides
export const PartnerFormSchema = PartnerBaseSchema.extend({
  memberId: z.string().default(''),      
  companyName: z.string().default(''),   
});

// Base Partner Schema (for full partner entity)
export const PartnerSchema = PartnerBaseSchema.and(WixEntityMetadataSchema);


// Export inferred types
export type Partner = z.infer<typeof PartnerSchema>;
export type PartnerStatus = z.infer<typeof PartnerStatusSchema>;
export type PartnerBase = z.infer<typeof PartnerBaseSchema>;
export type PartnerForm = z.infer<typeof PartnerFormSchema>;