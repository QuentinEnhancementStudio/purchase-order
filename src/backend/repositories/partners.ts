import { Partner } from '../types/entities/partner';
import { WixCollectionsRepository } from './wix-data/wix-collections';
import { DataOperationOptions } from '../types/base-entity';

export class PartnersRepository extends WixCollectionsRepository<Partner> {
  protected readonly collectionName = 'Partners';
  protected readonly debugEnabled = false;

  /**
   * Create a new partner
   */
  async createPartner(partnerData: Omit<Partner, '_id' | '_createdDate' | '_updatedDate' | '_owner'>): Promise<Partner> {
    // Validate required fields
    this.validateRequiredFields(partnerData, ['memberId', 'companyName', 'contactInfo', 'billingInfo', 'status']);
    
    return await this.create(partnerData);
  }

  /**
   * Get all partners
   */
  async getAllPartners(): Promise<Partner[]> {
    return await this.findAll();
  }

  /**
   * Find partner by ID
   */
  async getPartnerById(id: string): Promise<Partner | null> {
    return await this.findById(id);
  }

  /**
   * Find partner by member ID
   */
  async getPartnerByMemberId(memberId: string): Promise<Partner | null> {
    return await this.findOneByField('memberId', memberId);
  }

  /**
   * Update partner
   */
  async updatePartner(updates: Partial<Partner> & { _id: string }): Promise<Partner> {
    return await this.update(updates);
  }


  /**
   * Hard delete partner (removes from collection)
   */
  async removePartner(id: string): Promise<Partner> {
    return await this.remove(id);
  }

  /**
   * Search partners with advanced filters
   */
  async searchPartners(filters: {
    status?: Partner['status'];
    companyName?: string;
    email?: string;
    limit?: number;
    skip?: number;
  }, options?: DataOperationOptions): Promise<Partner[]> {
    try {
      let query = this.query();

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.companyName) {
        query = query.contains('companyName', filters.companyName);
      }
      
      if (filters.email) {
        query = query.eq('contactInfo.email', filters.email);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.skip) {
        query = query.skip(filters.skip);
      }

      const result = await query.find(options);
      return result.items as unknown as Partner[];
    } catch (error) {
      throw this.handleWixError(error, 'searchPartners', this.collectionName);
    }
  }
}