import { Partner } from '../../types/entities/partner';
import { WixCollectionsRepository } from '../wix-data/wix-collections';
import { DataOperationOptions } from '../../types/base-entity';

export class PartnersRepository extends WixCollectionsRepository<Partner> {
  protected readonly collectionName = 'Partners';

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
   * Find partner by email
   */
  async getPartnerByEmail(email: string): Promise<Partner | null> {
    try {
      const result = await this.query()
        .eq('contactInfo.email', email)
        .limit(1)
        .find();
      
      return result.items[0] as unknown as Partner || null;
    } catch (error) {
      throw this.handleWixError(error);
    }
  }

  /**
   * Update partner
   */
  async updatePartner(updates: Partial<Partner> & { _id: string }): Promise<Partner> {
    return await this.update(updates);
  }

  /**
   * Update partner status
   */
  async updatePartnerStatus(id: string, status: Partner['status']): Promise<Partner> {
    return this.updatePartner({ _id: id, status });
  }

  /**
   * Find active partners
   */
  async getActivePartners(): Promise<Partner[]> {
    return await this.findByField('status', 'active');
  }

  /**
   * Find partners by status
   */
  async getPartnersByStatus(status: Partner['status']): Promise<Partner[]> {
    return await this.findByField('status', status);
  }


  /**
   * Count partners by status
   */
  async countPartnersByStatus(status: Partner['status']): Promise<number> {
    return await this.countByField('status', status);
  }

  /**
   * Get total number of partners
   */
  async getTotalPartnersCount(): Promise<number> {
    return await this.count();
  }

  /**
   * Delete partner (soft delete by setting status to inactive)
   */
  async deactivatePartner(id: string): Promise<Partner> {
    return this.updatePartnerStatus(id, 'inactive');
  }

  /**
   * Hard delete partner (removes from collection)
   */
  async removePartner(id: string): Promise<Partner> {
    return await this.remove(id);
  }

  /**
   * Invite a new partner
   * TODO: Implement actual invitation logic with email service
   */
  async invitePartner(email: string, companyName: string): Promise<void> {
    // Check if partner already exists
    const existingPartner = await this.getPartnerByEmail(email);
    if (existingPartner) {
      throw new Error('Partner with this email already exists');
    }

    // TODO: Implement actual invitation logic
    console.log(`Inviting partner: ${email} from ${companyName}`);
    // This would typically:
    // 1. Create a partner invitation record
    // 2. Send an email invitation
    // 3. Generate invitation token
    return Promise.resolve();
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
      throw this.handleWixError(error);
    }
  }
}