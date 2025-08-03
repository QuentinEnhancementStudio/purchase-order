export interface Partner {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  _owner?: string;
  memberId: string;
  companyName: string;
  contactInfo: ContactDetails;
  billingInfo: BillingDetails;
  status: PartnerStatus;
  catalogId?: string;
}

export interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface BillingDetails {
  companyAddress: Address;
  taxId?: string;
  paymentTerms?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

export type PartnerStatus = 'active' | 'inactive' | 'pending';

export interface PartnerInvitation {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  _owner?: string;
  email: string;
  companyName: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresDate: Date;
  token: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';