import { z } from 'zod';

// Constraint constants - single source of truth
export const FIRST_NAME_MAX_LENGTH = 100;
export const FIRST_NAME_MIN_LENGTH = 1;
export const LAST_NAME_MAX_LENGTH = 100;
export const LAST_NAME_MIN_LENGTH = 1;
export const EMAIL_MAX_LENGTH = 320;

// Member Status Schema - using Wix Members API status values
export const MemberStatusSchema = z.enum(['APPROVED', 'PENDING', 'OFFLINE']);

// Base Field Schemas
export const FirstNameSchema = z.string()
  .min(1, 'First name is required')
  .max(FIRST_NAME_MAX_LENGTH, `First name cannot exceed ${FIRST_NAME_MAX_LENGTH} characters`)
  .trim();

export const LastNameSchema = z.string()
  .min(1, 'Last name is required')
  .max(LAST_NAME_MAX_LENGTH, `Last name cannot exceed ${LAST_NAME_MAX_LENGTH} characters`)
  .trim();

export const EmailSchema = z.email('Invalid email format')
  .max(EMAIL_MAX_LENGTH, `Email cannot exceed ${EMAIL_MAX_LENGTH} characters`)
  .trim()
  .toLowerCase();

export const MemberIdSchema = z.string().min(1, 'Member ID is required');

export const MemberBaseSchema = z.object({
  _id: MemberIdSchema,
  loginEmail: EmailSchema,
  contact: z.object({
    firstName: FirstNameSchema.optional(),
    lastName: LastNameSchema.optional(),
  }).optional(),
  status: MemberStatusSchema,
  _createdDate: z.coerce.date(),
  _updatedDate: z.coerce.date(),
}).transform((data) => ({
  ...data,
  contact: {
    ...data.contact,
    displayName: data.contact?.firstName || data.contact?.lastName 
      ? `${data.contact.firstName} ${data.contact.lastName}`.trim()
      : data.loginEmail ? data.loginEmail : data._id
  }
}));

// Member Schema (complete member entity)
export const MemberSchema = MemberBaseSchema;

// Export inferred types
export type Member = z.infer<typeof MemberSchema>;
export type MemberStatus = z.infer<typeof MemberStatusSchema>;
export type MemberBase = z.infer<typeof MemberBaseSchema>;
