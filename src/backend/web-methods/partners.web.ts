import { webMethod, Permissions } from '@wix/web-methods';
import { PartnerEntity } from '../entities/partner/partner';
import { PartnersRepository } from '../repositories/partners/partners';
import { Partner } from '../types/entities/partner';

// Global repository instance - reused across all web methods
const partnersRepository = new PartnersRepository();

export const getPartners = webMethod(
  Permissions.Admin,
  async (): Promise<Partner[]> => {
    try {
      const partners = await partnersRepository.getAllPartners();
      return partners;
    } catch (error) {
      console.error('Error fetching partners:', error);
      throw new Error('Failed to fetch partners');
    }
  }
);

export const getPartnerById = webMethod(
  Permissions.Admin,
  async (partnerId: string): Promise<Partner> => {
    try {
      const partner = await partnersRepository.getPartnerById(partnerId);
      if (!partner) {
        throw new Error('Partner not found');
      }
      return partner;
    } catch (error) {
      console.error('Error fetching partner:', error);
      throw new Error('Failed to fetch partner');
    }
  }
);

export const createPartner = webMethod(
  Permissions.Admin,
  async (partnerData: any): Promise<Partner> => {
    try {
      // Validate input
      const validationResult = PartnerEntity.validateCreateInput(partnerData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors?.join(', ') || 'Validation failed');
      }

      // Create partner
      const partner = await partnersRepository.createPartner(partnerData);
      return partner;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw new Error('Failed to create partner');
    }
  }
);

export const updatePartner = webMethod(
  Permissions.Admin,
  async (partnerToUpdate: any): Promise<Partner> => {
    try {
      const partner = await partnersRepository.updatePartner(partnerToUpdate);
      return partner;
    } catch (error) {
      console.error('Error updating partner:', error);
      throw new Error('Failed to update partner');
    }
  }
);

export const invitePartner = webMethod(
  Permissions.Admin,
  async (email: string, companyName: string): Promise<void> => {
    try {
      await partnersRepository.invitePartner(email, companyName);
    } catch (error) {
      console.error('Error inviting partner:', error);
      throw new Error('Failed to send partner invitation');
    }
  }
);

export const updatePartnerStatus = webMethod(
  Permissions.Admin,
  async (partnerId: string, status: string): Promise<Partner> => {
    try {
      const partner = await partnersRepository.updatePartnerStatus(partnerId, status as any);
      return partner;
    } catch (error) {
      console.error('Error updating partner status:', error);
      throw new Error('Failed to update partner status');
    }
  }
);